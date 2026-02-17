
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


    constructor() {}

    init(provenanceGraph: ProvenanceGraph): void {
        const contentDeducer = new ResourceContentDeducer(provenanceGraph.trace)
        contentDeducer.deduce(provenanceGraph)
    }


    getProvenanceFromNode(provenanceGraph: DirectedGraph, targetNode: string, causalProperties: CausalProperty[]): DirectedGraph {

        const reversedGraph = reverse(provenanceGraph)
        
        let reachableSubgraph: DirectedGraph
        reachableSubgraph = this.getReachableSubgraph(reversedGraph, targetNode)

        // let interProcessAssertedPaths: DirectedGraph[]
        // interProcessAssertedPaths = this.getInterProcessAssertedPaths(reachableSubgraph)
        // console.log(interProcessAssertedPaths)

        // provenanceGraph.forEachNode((node) => {
        //     const label = provenanceGraph.getNodeAttribute(node, 'label')!
        //     const verified = interProcessAssertedPaths.some((g) => g.findNode((_n, att) => att['label'] === label))
        //     if (verified) provenanceGraph.setNodeAttribute(node, 'color', 'blue')
        // })

        let intraProcessPaths: { asserted: DirectedGraph[], discarded: DirectedGraph[] }
        intraProcessPaths = this.getIntraProcessPaths(reachableSubgraph, causalProperties)

        provenanceGraph.forEachNode((node) => {
            const label = provenanceGraph.getNodeAttribute(node, 'label')!
            const verified = intraProcessPaths.asserted.some((g) => g.findNode((_n, att) => att['label'] === label))
            if (verified) provenanceGraph.setNodeAttribute(node, 'color', 'blue')
        })

        return reverse(reachableSubgraph)
    }


    test(provenanceGraph: ProvenanceGraph, targetNode: string, causalProperties: CausalProperty[]): void {

        const graph = provenanceGraph.graph
        const reversedGraph = reverse(graph)
        
        let reachableSubgraph: DirectedGraph
        reachableSubgraph = this.getReachableSubgraph(reversedGraph, targetNode)

        const eventResourceNode = reachableSubgraph.outNeighbors(targetNode).find(n => {
            const nEntity = reachableSubgraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Resource
        })

        if (!eventResourceNode) {
            console.error(`[FATAL] Could not find resource node for target event in provenance graph.`)
            return;
        }

        const resourceContent = graph.getNodeAttribute(eventResourceNode, "resourceContent") as ResourceContent
        const targetEvent = graph.getNodeAttribute(targetNode, "event") as Event
        const sourceEvents = ResourceContentDeducer.getSourceEvents(resourceContent, targetEvent)

        console.log("Source events: ", sourceEvents)

        if (sourceEvents.length === 0){
            console.log("[ERROR] No source event for target event in resource content deducer. No asserted path.")
            console.log("Event resource content: ", resourceContent)
            console.log("Target event: ", targetEvent)
            console.log("Source events: ", sourceEvents)
            return;
        }

        const assertedDataPath = this.buildInterProcessPath(provenanceGraph.graph, targetEvent, sourceEvents)
        if (!assertedDataPath) {
            console.error("[FATAL] Could not build asserted path for event.", targetEvent)
            return;
        }

        graph.forEachNode((node) => {
            const label = graph.getNodeAttribute(node, 'label')!
            const verified = assertedDataPath.findNode((_n, att) => att['label'] === label)
            if (verified) graph.setNodeAttribute(node, 'color', 'red')
        })


        // const deducer = new IntraProcessDeducer(reachableSubgraph, causalProperties)

        // const event = reachableSubgraph.getNodeAttribute(targetNode, "event") as Event
        // const sourceEvents = deducer.getSourceEvents(event)

        // if (sourceEvents.dependent.length === 0){
        //     console.log(`[LOG] No dependent source event for target event ${event} in intra-process deducer. No asserted path.`)
        // } else {
        //     console.log(`[LOG] Found dependent source events ${sourceEvents.dependent} for target event ${event} in intra-process deducer. Building asserted path.`)
        //     const assertedPath = this.buildIntraProcessPath(reachableSubgraph, event, sourceEvents.dependent)
        //     if (!assertedPath) {
        //         console.error(`[FATAL] Could not build asserted path for event ${event}.`)
        //         return
        //     }

        //     console.log(assertedPath)

        //     provenanceGraph.forEachNode((node) => {
        //         const label = provenanceGraph.getNodeAttribute(node, 'label')!
        //         const verified = assertedPath.findNode((_n, att) => att['label'] === label)
        //         if (verified) provenanceGraph.setNodeAttribute(node, 'color', 'blue')
        //     })
        // }

        
        // if (sourceEvents.independent.length === 0){
        //     console.log(`[LOG] No independent source event for target event ${event} in intra-process deducer. No discarded path.`)
        // } else {
        //     console.log(`[LOG] Found independent source events ${sourceEvents.independent} for target event ${event} in intra-process deducer. Building discarded path.`)
        //     const discardedPath = this.buildIntraProcessPath(reachableSubgraph, event, sourceEvents.independent)
        //     if (!discardedPath) {
        //         console.error(`[FATAL] Could not build discarded path for event ${event}.`)
        //     }
            
        // }

        // provenanceGraph.forEachNode((node) => {
        //     const label = provenanceGraph.getNodeAttribute(node, 'label')!
        //     const verified = discardedPath?.findNode((_n, att) => att['label'] === label)
        //     if (verified) provenanceGraph.setNodeAttribute(node, 'color', 'red')
        // })
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


    getDataPaths(provenanceGraph: DirectedGraph, startNode: string, event: Event): DirectedGraph {

        const dataPaths: DirectedGraph[] = []
        const resource = Array.from(event.otherEntities)[0]
        
        const resourceNode = provenanceGraph.outNeighbors(startNode).find(n => {
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEntity === resource
        })

        if (!resourceNode) {
            console.error(`[FATAL] Could not find resource node for event ${event}.`)
            return new DirectedGraph();
        }

        const resourceContent = provenanceGraph.getNodeAttribute(resourceNode, "resourceContent") as ResourceContent
        const sourceEvents = resourceContent.getSourceEvents(event)
        
        for (const sourceEvent of sourceEvents) {
            
            const dataPath = new DirectedGraph()
            dataPath.addNode(resourceNode, provenanceGraph.getNodeAttributes(resourceNode))

            let previousNode = resourceNode
            let currentNode = getPreviousNodeForEntity(provenanceGraph, resourceNode, true)
            if (!currentNode) {
                console.log(previousNode)
                console.log(currentNode)
                console.error(`[FATAL] Could not find previous node for resource ${resource} in provenance graph.`)
                continue;
            }
            try {
                dataPath.addNode(currentNode, provenanceGraph.getNodeAttributes(currentNode))
                dataPath.addEdge(previousNode, currentNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentNode)))
            } catch (e) {
                console.warn("")
            }

            let currentEvent = provenanceGraph.getNodeAttribute(currentNode, "event")

            while ( currentEvent && currentEvent !== sourceEvent ) {
                previousNode = currentNode!
                currentNode = getPreviousNodeForEntity(provenanceGraph, resourceNode, true)
                if (!currentNode) {
                    console.error(`[FATAL] Could not find previous node for resource ${resource} in provenance graph.`)
                    continue;
                }
                dataPath.addNode(currentNode, provenanceGraph.getNodeAttributes(currentNode))
                dataPath.addEdge(previousNode, currentNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentNode)))
        
                currentEvent = currentNode ? provenanceGraph.getNodeAttribute(currentNode, "event") as Event : null
            }

            if ( currentEvent !== sourceEvent ) {
                console.error(`[FATAL] Could not find source event ${sourceEvent} in provenance graph.`)
                continue;
            }

            const sourceProcessNode = provenanceGraph.outNeighbors(currentNode).find(n => {
                const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
                const nEvent = provenanceGraph.getNodeAttribute(n, "event") as Event
                console.log(nEntity)
                console.log(nEvent)
                console.log(nEntity instanceof Process)
                console.log(nEvent === sourceEvent)
                return (nEntity instanceof Process) && (nEvent === sourceEvent)
            })

            if (!sourceProcessNode) {
                console.log(event)
                console.log(currentNode)
                console.log(sourceProcessNode)
                console.error(`[FATAL] Could not find source process node for event ${sourceEvent}.`)
                continue;
            }

            dataPath.addNode(sourceProcessNode, provenanceGraph.getNodeAttributes(sourceProcessNode))
            dataPath.addEdge(currentNode, sourceProcessNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(currentNode, sourceProcessNode)))

            dataPaths.push(dataPath)
        }

        if (dataPaths.length === 1) {
            return dataPaths[0];
        }

        const mergedDataPath = dataPaths.reduce( (acc, curr) => { return union(acc, curr) }, new DirectedGraph() )
        return mergedDataPath;
    }


    getInterProcessAssertedPaths(provenanceGraph: DirectedGraph): DirectedGraph[] {

        const assertedPaths: DirectedGraph[] = []

        for (const node of provenanceGraph.nodes()) {
            const entity = provenanceGraph.getNodeAttribute(node, "entity") as Entity
            if (! (entity instanceof Process)) {
                continue;
            }
            const event = provenanceGraph.getNodeAttribute(node, "event") as Event
            if (!event || event.eventType !== "ExitReadEvent") {
                continue;
            }
            
            const dataPath = this.getDataPaths(provenanceGraph, node, event)
            assertedPaths.push(dataPath)
        }
    
        return assertedPaths
    }


    getIntraProcessPaths(provenanceGraph: DirectedGraph, causalProperties: CausalProperty[])
    : { asserted: DirectedGraph[], discarded: DirectedGraph[] } {

        const assertedPaths: DirectedGraph[] = []
        const discardedPaths: DirectedGraph[] = []
        const deducer = new IntraProcessDeducer(provenanceGraph, causalProperties)

        for (const node of provenanceGraph.nodes()) {
            const event = provenanceGraph.getNodeAttribute(node, "event") as Event
            if (!event) {
                continue;
            }

            const sourceEvents = deducer.getSourceEvents(event)
            const assertedPath = this.buildIntraProcessPath(provenanceGraph, event, sourceEvents.dependent)
            const discardedPath = this.buildIntraProcessPath(provenanceGraph, event, sourceEvents.independent)

            if (assertedPath) {
                assertedPaths.push(assertedPath)
            }

            if (discardedPath) {
                discardedPaths.push(discardedPath)
            }
        }

        return { asserted: assertedPaths, discarded: discardedPaths }
    }


    buildIntraProcessPath(provenanceGraph: DirectedGraph, targetEvent: Event, sourceEvents: Event[]): DirectedGraph | null {

        if (sourceEvents.length === 0) {
            console.log(`[LOG] No source event for target event ${targetEvent} in intra-process deducer.`)
            return new DirectedGraph();
        }

        const path = new DirectedGraph()

        const targetNode = provenanceGraph.findNode((n) => {
            const nEvent = provenanceGraph.getNodeAttribute(n, "event") as Event
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEvent === targetEvent && nEntity instanceof Resource
        })

        if (!targetNode) {
            console.error(`[FATAL] Could not find target node for event ${targetEvent} in provenance graph.`)
            return null;
        }

        path.addNode(targetNode, provenanceGraph.getNodeAttributes(targetNode))

        const sourceEventPool = new Set(sourceEvents)
        let currentProcessNode: string | undefined | null = provenanceGraph.outNeighbors(targetNode).find(n => {
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Process
        })

        if (!currentProcessNode) {
            console.error(`[FATAL] Could not find process node for target event ${targetEvent} in provenance graph.`)
            return null;
        }

        let previousNode = targetNode
        while (currentProcessNode && sourceEventPool.size > 0) {

            path.addNode(currentProcessNode, provenanceGraph.getNodeAttributes(currentProcessNode))
            path.addEdge(previousNode, currentProcessNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentProcessNode)))

            const currentEvent = provenanceGraph.getNodeAttribute(currentProcessNode, "event") as Event

            if (sourceEventPool.has(currentEvent)) {
                const outNeighbors = provenanceGraph.outNeighbors(currentProcessNode)
                for (const neighbor of outNeighbors) {
                    path.addNode(neighbor, provenanceGraph.getNodeAttributes(neighbor))
                    path.addEdge(currentProcessNode, neighbor, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(currentProcessNode, neighbor)))
                }
                
                //TODO: default behavior is to stop on the first match
                break
            }

            previousNode = currentProcessNode
            currentProcessNode = getPreviousNodeForEntity(provenanceGraph, currentProcessNode, true)
        }

        return path
    }

    buildInterProcessPath(provenanceGraph: DirectedGraph, targetEvent: Event, sourceEvents: Event[]): DirectedGraph | null {

        const path = new DirectedGraph()

        const targetNode = provenanceGraph.findNode((n) => {
            const nEvent = provenanceGraph.getNodeAttribute(n, "event") as Event
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEvent === targetEvent && nEntity instanceof Process
        })

        if (!targetNode) {
            console.error(`[FATAL] Could not find target node for event ${targetEvent} in provenance graph.`)
            return null;
        }

        path.addNode(targetNode, provenanceGraph.getNodeAttributes(targetNode))

        const sourceEventPool = new Set(sourceEvents)
        let currentResourceNode: string | undefined | null = provenanceGraph.outNeighbors(targetNode).find(n => {
            const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
            return nEntity instanceof Resource
        })

        if (!currentResourceNode) {
            console.error(`[FATAL] Could not find process node for target event ${targetEvent} in provenance graph.`)
            return null;
        }

        let previousNode = targetNode
        while (currentResourceNode && sourceEventPool.size > 0) {

            path.addNode(currentResourceNode, provenanceGraph.getNodeAttributes(currentResourceNode))
            path.addEdge(previousNode, currentResourceNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentResourceNode)))

            const currentEvent = provenanceGraph.getNodeAttribute(currentResourceNode, "event") as Event

            if (sourceEventPool.has(currentEvent)) {
                const outNeighbors = provenanceGraph.outNeighbors(currentResourceNode)
                for (const neighbor of outNeighbors) {
                    path.addNode(neighbor, provenanceGraph.getNodeAttributes(neighbor))
                    path.addEdge(currentResourceNode, neighbor, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(currentResourceNode, neighbor)))
                }
            }

            previousNode = currentResourceNode
            currentResourceNode = getPreviousNodeForEntity(provenanceGraph, currentResourceNode, true)
        }

        return path
    }
}