
import Graph from 'graphology'

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


interface IClonable<T> {
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


export type { IClonable }