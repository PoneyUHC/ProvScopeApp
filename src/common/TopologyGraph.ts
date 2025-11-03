
import DirectedGraph from 'graphology'
import FA2Layout from "graphology-layout-forceatlas2"

import { ExecutionTrace } from "./ExecutionTrace/ExecutionTrace"
import { Entity, Event } from "./types"
import { toUniform, IClonable } from "./utils"


export class TopologyGraph implements IClonable<TopologyGraph> {

    graph: DirectedGraph
    trace: ExecutionTrace
    traceName: string;
    currentEvent: Event

    entityNodeCache: Map<Entity, string> = new Map<Entity, string>()

    // shouldInit is used to make more efficient copies
    private constructor(trace: ExecutionTrace, shouldInit: boolean) {
        this.trace = trace
        this.graph = new DirectedGraph()
        this.traceName = trace.filename.split('/').pop() || ""
        this.currentEvent = trace.events[0]

        if ( shouldInit ) {
            this.graph = this.initGraph()

            this.applyUntilEvent(trace.events[0])
        }
    }

    // create instead of public constructor to avoid giving the user the ability to create 
    // non-initialized instances of the class
    static create(trace: ExecutionTrace): TopologyGraph {
        return new TopologyGraph(trace, true)
    }


    clone (): TopologyGraph {
        const other = new TopologyGraph(this.trace, false)
        other.graph = this.graph.copy()

        other.applyUntilEvent(other.currentEvent)
        return other
    }


    initGraph(): DirectedGraph {

        const graph = new DirectedGraph();

        for (const resource of this.trace.resources) {
            const resourceLabel = resource.getUUID();
            graph.addNode(resourceLabel, {
                x: toUniform(resourceLabel)*10,
                y: toUniform(resourceLabel+'1')*10,
                size: 10,
                color: "green",
                label: resourceLabel,
                entity: resource
            });
            this.entityNodeCache.set(resource, resourceLabel);
        }
    
        for (const process of this.trace.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { 
                x: toUniform(processLabel)*10,
                y: toUniform(processLabel+'1')*10,
                size: 10,
                color: "red",
                label: processLabel,
                entity: process
            });
            this.entityNodeCache.set(process, processLabel);
        }

        FA2Layout.assign(graph, {iterations: 50});

        return graph
    }


    cleanGraph() {
        for (const edge of this.graph.edges() ) {
            this.graph.dropEdge(edge);
        }
    }


    applyUntilEvent(targetEvent: Event): void {

        this.cleanGraph();

        for (const event of this.trace.events) {
            const lastEdges = this.applyEventToGraph(event);
            
            if (event === targetEvent) {
                lastEdges.forEach(edge => {
                    this.graph.setEdgeAttribute(edge, 'color', 'red')
                });
                break;
            }
        }
    }


    applyEventToGraph(event: Event) {

        const newEdges: string[] = []

        const source_entities = Array.from(event.sourceEntities)
        const target_entities = Array.from(event.targetEntities)

        for ( const sourceEntity of source_entities ) {
            const sourceNode = this.entityNodeCache.get(sourceEntity)
            if ( !sourceNode ) {
                console.error(`[FATAL] Source entity node not found for entity ${sourceEntity} in event ${event}.`)
                console.error('It should have been created during graph initialization.')
                continue
            }

            for ( const targetEntity of target_entities ) {
                const targetNode = this.entityNodeCache.get(targetEntity)
                if ( !targetNode ) {
                    console.error(`[FATAL] Target entity node not found for entity ${targetEntity} in event ${event}.`)
                    console.error('It should have been created during graph initialization.')
                    continue
                }

                const edgeLabel = event.id
                if ( !this.graph.hasEdge(sourceNode, targetNode) ) {
                    const newEdge = this.graph.addEdge(sourceNode, targetNode, {
                        label: edgeLabel,
                        color: 'black',
                        eventCount: 1
                    });
                    newEdges.push(newEdge)
                } else {
                    const currentEventCount = this.graph.getEdgeAttribute(sourceNode, targetNode, 'eventCount') as number
                    this.graph.setEdgeAttribute(sourceNode, targetNode, 'eventCount', currentEventCount + 1)
                }
            }
        }

        return newEdges
    }
}