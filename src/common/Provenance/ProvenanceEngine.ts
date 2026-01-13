
import DirectedGraph from "graphology"

import { bfsFromNode } from 'graphology-traversal/bfs';
import reverse from 'graphology-operators/reverse';


export class ProvenanceEngine {


    getProvenanceFromNode(provenanceGraph: DirectedGraph, nodeId: string): DirectedGraph {

        const reversedGraph = reverse(provenanceGraph)
        
        let provenanceSubgraph: DirectedGraph
        provenanceSubgraph = this.getReachableSubgraph(reversedGraph, nodeId)

        return provenanceSubgraph
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
}