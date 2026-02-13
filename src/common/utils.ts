
import Graph, { DirectedGraph } from 'graphology'
import { Entity, Process, Resource, Event } from './types';


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


export function getPreviousNodeForEntity(provenanceGraph: DirectedGraph, currentNode: string, reversed=false): string | null {

    let neighbors
    if (reversed) {
        neighbors = provenanceGraph.outNeighbors(currentNode)
    } else {
        neighbors = provenanceGraph.inNeighbors(currentNode)
    }
    const entity = provenanceGraph.getNodeAttribute(currentNode, "entity") as Entity

    for ( const neighbor of neighbors ) {
        const inNeighborEntity = provenanceGraph.getNodeAttribute(neighbor, "entity") as Entity
        if ( inNeighborEntity === entity ) {
            return neighbor
        }
    }

    return null
}


export function getProcessPriorEvents(provenanceGraph: DirectedGraph, startEvent: Event): Event[] {
    const baseEventID = startEvent.id;
    const nodes = provenanceGraph.filterNodes((node) => { 
        const event = provenanceGraph.getNodeAttribute(node, 'event')
        const eventID = event ? event.id : null
        return event && event.process === startEvent.process && eventID < baseEventID
    });
    console.log("nodes", nodes)
    return nodes.map((node) => provenanceGraph.getNodeAttribute(node, 'event'));
}


function isIndexable(value: unknown): value is Record<string, unknown> {
  return value !== null && (typeof value === "object");
}

export function getPath(obj: object, path: string): object | null {
  if (!path) return obj;

  let current: unknown = obj;

  for (const key of path.split(".")) {
    if (!isIndexable(current)) return null;
    current = current[key];
  }

  return current ? current : null;
}


        