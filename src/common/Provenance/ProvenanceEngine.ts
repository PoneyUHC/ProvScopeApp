
import DirectedGraph from "graphology"
import { bfsFromNode } from 'graphology-traversal/bfs';
import reverse from 'graphology-operators/reverse';
import union from 'graphology-operators/union';

import { Entity, Process, Event, Resource } from "@common/types";

import ProvenanceGraph from "./ProvenanceGraph";
import ResourceContentDeducer from "./InterProcess/ResourceContentDeducer";
import ResourceContent from "./InterProcess/ResourceContent";
import { getPreviousNodeForEntity } from "@common/utils";
import IntraProcessDeducer from "./IntraProcess/IntraProcessDeducer";
import { CausalProperty } from "./IntraProcess/CausalProperty";


export class ProvenanceEngine {

    provenanceGraph: ProvenanceGraph
    intraProcessDeducer: IntraProcessDeducer

    constructor(provenanceGraph: ProvenanceGraph, causalProperties: CausalProperty[]) {
        this.provenanceGraph = provenanceGraph
        this.intraProcessDeducer = new IntraProcessDeducer(new DirectedGraph(), causalProperties)

        const contentDeducer = new ResourceContentDeducer(provenanceGraph.trace)
        contentDeducer.deduce(provenanceGraph)
    }

    updateCausalProperties(causalProperties: CausalProperty[]) {
        this.intraProcessDeducer = new IntraProcessDeducer(this.provenanceGraph.graph, causalProperties)
    }

    getProvenanceFromNode(targetNode: string): [DirectedGraph, DirectedGraph, DirectedGraph] {

        const reversedGraph = reverse(this.provenanceGraph.graph)
        
        let reachableSubgraph: DirectedGraph
        reachableSubgraph = this.getReachableSubgraph(reversedGraph, targetNode)

        let assertedSubgraph = new DirectedGraph()
        let discardedSubgraph = new DirectedGraph()

        const leftToExplore = new Set<string>()
        leftToExplore.add(targetNode)

        let terminalNodes = new Set<string>()

        while (leftToExplore.size > 0) {
            const currentNode = leftToExplore.values().next().value!
            leftToExplore.delete(currentNode)

            const event = reachableSubgraph.getNodeAttribute(currentNode, "event") as Event
            if (!event) continue

            if (event.eventType === "WriteEvent") {

                const [dependentPath, dependentSourceEventNodes, independentPath, independentSourceEventNodes] = this.doIntraProcessAnalysis(currentNode, reachableSubgraph)
                if (dependentPath) {
                    assertedSubgraph = union(assertedSubgraph, dependentPath)
                }
                if (dependentSourceEventNodes.length === 0) {
                    terminalNodes.add(currentNode)
                } else {
                    dependentSourceEventNodes.forEach(n => leftToExplore.add(n))
                }
                if (independentPath) {
                    discardedSubgraph = union(discardedSubgraph, independentPath)
                }

            } else if (event.eventType === "ExitReadEvent") {

                const [dependentPath, dependentSourceEventNodes, independentPath, independentSourceEventNodes] = this.doIntraProcessAnalysis(currentNode, reachableSubgraph)
                if (dependentPath) {
                    assertedSubgraph = union(assertedSubgraph, dependentPath)
                }
                
                dependentSourceEventNodes.forEach(n => leftToExplore.add(n))
                
                if (independentPath) {
                    discardedSubgraph = union(discardedSubgraph, independentPath)
                }

                const [interProcessAssertedPath, interProcessSourceEventNodes] = this.doInterProcessAnalysis(currentNode, reachableSubgraph)
                if (interProcessAssertedPath) {
                    assertedSubgraph = union(assertedSubgraph, interProcessAssertedPath)
                }
                interProcessSourceEventNodes.forEach(n => leftToExplore.add(n))
                
                if (interProcessSourceEventNodes.length === 0 && dependentSourceEventNodes.length === 0) {
                    terminalNodes.add(currentNode)
                }
            }
        }


        // for (const node of terminalNodes) {
        //     const neighboringNodes = reachableSubgraph.outNeighbors(node)
        //     for (const neighbor of neighboringNodes) {
        //         if (!assertedSubgraph.hasNode(neighbor)) {
        //             assertedSubgraph.addNode(neighbor, reachableSubgraph.getNodeAttributes(neighbor))
        //             assertedSubgraph.addEdge(node, neighbor, reachableSubgraph.getEdgeAttributes(reachableSubgraph.edge(node, neighbor)))
        //         }
        //     }
        // }

        console.warn("Terminal nodes in provenance graph analysis: ", terminalNodes)
        terminalNodes = new Set(Array.from(terminalNodes).filter(n => {
            return !discardedSubgraph.hasNode(n)
        }))


        let uncertainGraph = new DirectedGraph()
        for (const node of terminalNodes) {
            const partialUncertainGraph = this.getReachableSubgraph(reversedGraph, node)
            uncertainGraph = union(uncertainGraph, partialUncertainGraph)
        }
    
        return [reverse(assertedSubgraph), reverse(discardedSubgraph), reverse(uncertainGraph)]
    }


    doIntraProcessAnalysis(targetNode: string, reachableSubgraph: DirectedGraph): [DirectedGraph | null, string[], DirectedGraph | null, string[]] {
        
        const targetEvent = reachableSubgraph.getNodeAttribute(targetNode, "event") as Event
        if (!targetEvent) {
            console.log(`[INFO] No event attribute for node ${targetNode} in reachable subgraph.`)
            return [null, [], null, []]
        }

        let dependentPath: DirectedGraph | null = null
        let dependentSourceProcessNodes: string[] = []
        let independentPath: DirectedGraph | null = null
        let independentSourceProcessNodes: string[] = []

        const {dependent: dependentEvents, independent: independentEvents} = this.intraProcessDeducer.getSourceEvents(targetEvent)

        if (dependentEvents.length === 0) {
            console.log(`[LOG] No dependent source events for target event ${targetEvent} in intra-process deducer. No asserted path.`)
            dependentPath = null
            dependentSourceProcessNodes = []
        } else {
            [dependentPath, dependentSourceProcessNodes] = this.buildIntraProcessPath(reachableSubgraph, targetNode, dependentEvents)
            if (!dependentPath) {
                console.error(`[FATAL] Could not build dependent path for event ${targetEvent}.`)
                dependentPath = null
                dependentSourceProcessNodes = []
            }
        }
        
        if (independentEvents.length === 0) {
            console.log(`[LOG] No independent source events for target event ${targetEvent} in intra-process deducer. No asserted path.`)
            independentPath = null
            independentSourceProcessNodes = []
        } else {
            [independentPath, independentSourceProcessNodes] = this.buildIntraProcessPath(reachableSubgraph, targetNode, independentEvents)
            if (!independentPath) {
                console.error(`[FATAL] Could not build independent path for event ${targetEvent}.`)
                independentPath = null
                independentSourceProcessNodes = []
            }
        }

        return [dependentPath, dependentSourceProcessNodes, independentPath, independentSourceProcessNodes]
    }


    doInterProcessAnalysis(targetNode: string, reachableSubgraph: DirectedGraph): [DirectedGraph | null, string[]] {

        const targetEvent = reachableSubgraph.getNodeAttribute(targetNode, "event") as Event
        if (!targetEvent) {
            console.log(`[FATAL] No event attribute for node ${targetNode} in reachable subgraph.`)
            return [null, []]
        }

        const resourceNode = reachableSubgraph.outNeighbors(targetNode).find(n => {
            const nEntity = reachableSubgraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Resource
        })

        if (!resourceNode) {
            console.error(`[FATAL] Could not find resource node for target node ${targetNode} in reachable subgraph.`)
            return [null, []]
        }

        const resourceContent = reachableSubgraph.getNodeAttribute(resourceNode, "resourceContent") as ResourceContent
        if (!resourceContent) {
            console.error(`[ERROR] No content attribute for resource node ${resourceNode} in reachable subgraph.`)
            return [null, []]
        }

        const sourceEvents = ResourceContentDeducer.getSourceEvents(resourceContent, targetEvent)
        if (sourceEvents.length === 0) {
            console.log(`[LOG] No source events for target event ${targetEvent} in inter-process deducer. No asserted path.`)
            return [null, []]
        }

        console.log("[LOG] Found source events for target event in inter-process deducer. Building asserted path.")
        console.log("[LOG] Source events: ", sourceEvents)
        console.log("[LOG] Target event: ", targetEvent)
        const [assertedPath, sourceProcessNodes] = this.buildInterProcessPath(reachableSubgraph, targetEvent, sourceEvents)
        if (!assertedPath) {
            console.error(`[FATAL] Could not build asserted path for event ${targetEvent}.`)
            return [null, []]
        }
        
        return [assertedPath, sourceProcessNodes]
    }


    getReachableSubgraph(provenanceGraph: DirectedGraph, nodeId: string): DirectedGraph {

        const subgraph = new DirectedGraph()

        // The state expanded provenance graph being a DAG, we get each node once by bfs
        // Then we get each edge once by bfs + taking only out edges, and the edge's target already exists

        bfsFromNode(
            provenanceGraph,
            nodeId,
            (currentNode, attr, _depth) => {
                subgraph.addNode(currentNode, attr)
            }
        )

        bfsFromNode(
            provenanceGraph,
            nodeId,
            (currentNode, _attr, _depth) => {
                const edges = provenanceGraph.outboundEdges(currentNode)
                for (const edge of edges) {
                    const target = provenanceGraph.target(edge)
                    const edgeAttr = provenanceGraph.getEdgeAttributes(edge)
                    subgraph.addEdge(currentNode, target, edgeAttr)
                }
            }
        )

        return subgraph
    }


    buildIntraProcessPath(provenanceGraph: DirectedGraph, targetNode: string, sourceEvents: Event[]): [DirectedGraph | null, string[]] {

        if (sourceEvents.length === 0) {
            console.log(`[LOG] No source event for target node ${targetNode} in intra-process deducer.`)
            return [null, []];
        }

        let path = new DirectedGraph()
        const sourceProcessNodes: string[] = []

        path.addNode(targetNode, provenanceGraph.getNodeAttributes(targetNode))

        const sourceEventPool = new Set(sourceEvents)
        let currentProcessNode: string | undefined | null = provenanceGraph.outNeighbors(targetNode).find(n => {
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Process
        })

        if (!currentProcessNode) {
            console.error(`[FATAL] Could not find process node for target node ${targetNode} in provenance graph.`)
            return [null, []];
        }

        let previousNode = targetNode
        let partialPath = path.copy()
        while (currentProcessNode && sourceEventPool.size > 0) {

            if ( !partialPath.hasNode(currentProcessNode) ) {
                partialPath.addNode(currentProcessNode, provenanceGraph.getNodeAttributes(currentProcessNode))
                partialPath.addEdge(previousNode, currentProcessNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentProcessNode)))
            }

            const currentEvent = provenanceGraph.getNodeAttribute(currentProcessNode, "event") as Event

            if (sourceEventPool.has(currentEvent)) {

                path = union(path, partialPath)
                sourceProcessNodes.push(currentProcessNode)

                //TODO: default behavior is to stop on the first match
                break
            }

            previousNode = currentProcessNode
            currentProcessNode = getPreviousNodeForEntity(provenanceGraph, currentProcessNode, true)
        }

        return [path, sourceProcessNodes]
    }

    buildInterProcessPath(provenanceGraph: DirectedGraph, targetEvent: Event, sourceEvents: Event[]): [DirectedGraph | null, string[]] {

        let path = new DirectedGraph()

        const targetNode = provenanceGraph.findNode((n) => {
            const nEvent = provenanceGraph.getNodeAttribute(n, "event") as Event
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEvent === targetEvent && nEntity instanceof Process
        })

        if (!targetNode) {
            console.error(`[FATAL] Could not find target node for event ${targetEvent} in provenance graph.`)
            return [null, []];
        }

        path.addNode(targetNode, provenanceGraph.getNodeAttributes(targetNode))

        const sourceEventPool = new Set(sourceEvents)
        let currentResourceNode: string | undefined | null = provenanceGraph.outNeighbors(targetNode).find(n => {
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Resource
        })

        if (!currentResourceNode) {
            console.error("[FATAL] Could not find resource node for target event in provenance graph.", targetEvent)
            return [null, []];
        }

        const sourceProcessNodes: string[] = []
        let previousNode = targetNode
        let partialPath = path.copy()
        while (currentResourceNode && sourceEventPool.size > 0) {

            if ( !partialPath.hasNode(currentResourceNode) ) {
                partialPath.addNode(currentResourceNode, provenanceGraph.getNodeAttributes(currentResourceNode))
                partialPath.addEdge(previousNode, currentResourceNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentResourceNode)))
            }

            const currentEvent = provenanceGraph.getNodeAttribute(currentResourceNode, "event") as Event

            if (sourceEventPool.has(currentEvent)) {
                path = union(path, partialPath)
                sourceProcessNodes.push(currentResourceNode)
                
                const processNode = provenanceGraph.outNeighbors(currentResourceNode).find(n => {
                    const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
                    return nEntity instanceof Process
                })
                if (processNode) {
                    path.addNode(processNode, provenanceGraph.getNodeAttributes(processNode))
                    path.addEdge(currentResourceNode, processNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(currentResourceNode, processNode)))
                    sourceProcessNodes.push(processNode)
                }

                // const previousResourceNode = getPreviousNodeForEntity(provenanceGraph, currentResourceNode, true)
                // if (previousResourceNode) {
                //     path.addNode(previousResourceNode, provenanceGraph.getNodeAttributes(previousResourceNode))
                //     path.addEdge(currentResourceNode, previousResourceNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(currentResourceNode, previousResourceNode)))
                // }
            }

            previousNode = currentResourceNode
            currentResourceNode = getPreviousNodeForEntity(provenanceGraph, currentResourceNode, true)
        }

        return [path, sourceProcessNodes]
    }
}