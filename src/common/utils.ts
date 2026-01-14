
import Graph, { DirectedGraph } from 'graphology'
import { Entity, Process, Resource } from './types';


export function toUniform(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    
    // Apply a bitwise operation to further randomize the hash
    hash = ((hash << 5) - hash) + (hash >> 2);
    hash = hash ^ (hash << 13);
    hash = hash ^ (hash >> 17);
    hash = hash ^ (hash << 5);
    hash = hash >>> 0; // Ensure non-negative integerhash = hash >>> 0; // Ensure non-negative integer

    return hash / 2**32;
}


export interface IClonable<T> {
    clone(): T
}


export function areConnected(nodes: string[], graph: Graph): boolean {
    
    const visited = new Set<string>()
    const toVisit = [nodes[0]];

    while (toVisit.length > 0) {
        const current = toVisit.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const neighbor of graph.neighbors(current)) {
            if (!visited.has(neighbor) && nodes.includes(neighbor)) {
                toVisit.push(neighbor);
            }
        }
    }

    return visited.size === nodes.length;
}


export function clamp(value: number, lower: number, upper: number) {
    return Math.max( Math.min( value, upper), lower)
}


export function getNodesByType(graph: Graph): Map<string, string[]> {

    const typeToNodes = new Map<string, string[]>()

    for (const node of graph.nodes()) {
        const entity = graph.getNodeAttribute(node, 'entity')

        let type = 'Others'
        if (entity instanceof Process) {
            type = 'Process'
        } else if (entity instanceof Resource) {
            if (entity.getUUID().endsWith('STDOUT') || entity.getUUID().endsWith('STDERR') || entity.getUUID().endsWith('STDIN')) {
                type = 'STDIO'
            } else {
                if (entity.resourceType === 4) {
                    type = 'File'
                } else {
                    type = 'FIFO'
                }
            }
        }

        if ( ! typeToNodes.get(type) ){
            typeToNodes.set(type, [])
        }
        typeToNodes.get(type)!.push(node)
    }

    return typeToNodes
}


export function getPreviousNodeForEntity(provenanceGraph: DirectedGraph, currentNode: string): string | null {

    const inNeighbors = provenanceGraph.inNeighbors(currentNode)
    const entity = provenanceGraph.getNodeAttribute(currentNode, "entity") as Entity

    for ( const inNeighbor of inNeighbors ) {
        const inNeighborEntity = provenanceGraph.getNodeAttribute(inNeighbor, "entity") as Entity
        if ( inNeighborEntity === entity ) {
            return inNeighbor
        }
    }

    return null
}