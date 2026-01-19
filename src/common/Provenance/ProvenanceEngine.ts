
import DirectedGraph from "graphology"
import { bfsFromNode } from 'graphology-traversal/bfs';
import reverse from 'graphology-operators/reverse';
import union from 'graphology-operators/union';

import { Entity, Process, Event } from "@common/types";

import ProvenanceGraph from "./ProvenanceGraph";
import ResourceContentDeducer from "./InterProcess/ResourceContentDeducer";
import ResourceContent from "./InterProcess/ResourceContent";
import { getPreviousNodeForEntity } from "@common/utils";


export class ProvenanceEngine {

    constructor() {}


    init(provenanceGraph: ProvenanceGraph): void {
        const contentDeducer = new ResourceContentDeducer(provenanceGraph.trace)
        contentDeducer.deduce(provenanceGraph)
    }


    getProvenanceFromNode(provenanceGraph: DirectedGraph, nodeId: string): DirectedGraph {

        const reversedGraph = reverse(provenanceGraph)
        
        let reachableSubgraph: DirectedGraph
        reachableSubgraph = this.getReachableSubgraph(reversedGraph, nodeId)

        let interProcessAssertedPaths: DirectedGraph[]
        interProcessAssertedPaths = this.getInterProcessAssertedPaths(reachableSubgraph)
        console.log(interProcessAssertedPaths)

        provenanceGraph.forEachNode((node) => {
            const label = provenanceGraph.getNodeAttribute(node, 'label')!
            const verified = interProcessAssertedPaths.some((g) => g.findNode((_n, att) => att['label'] === label))
            if (verified) provenanceGraph.setNodeAttribute(node, 'color', 'blue')
        })

        return reachableSubgraph
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
            let currentNode = getPreviousNodeForEntity(provenanceGraph, resourceNode)
            if (!currentNode) {
                console.error(`[FATAL] Could not find previous node for resource ${resource} in provenance graph.`)
                continue;
            }
            dataPath.addNode(currentNode, provenanceGraph.getNodeAttributes(currentNode))
            dataPath.addEdge(previousNode, currentNode, provenanceGraph.getEdgeAttributes(provenanceGraph.edge(previousNode, currentNode)))

            let currentEvent = provenanceGraph.getNodeAttribute(currentNode, "event")

            while ( currentEvent && currentEvent !== sourceEvent ) {
                previousNode = currentNode!
                currentNode = getPreviousNodeForEntity(provenanceGraph, resourceNode)
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

            const sourceProcessNode = provenanceGraph.inNeighbors(currentNode).find(n => {
                const nEntity = provenanceGraph.getNodeAttribute(n, "entity") as Entity
                const nEvent = provenanceGraph.getNodeAttribute(n, "event") as Event
                return nEntity instanceof Process && nEvent === sourceEvent
            })

            if (!sourceProcessNode) {
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


    

}