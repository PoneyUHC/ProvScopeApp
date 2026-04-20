
import DirectedGraph from 'graphology'

import { ExecutionTrace } from '../ExecutionTrace/ExecutionTrace'
import { Entity, Event } from '../types'


export default class ProvenanceGraph {

    trace: ExecutionTrace
    graph: DirectedGraph
    buildTimeMs: number = 0


    constructor(trace: ExecutionTrace) {
        this.trace = trace
        this.graph = new DirectedGraph()

        const t0 = Date.now()
        this.loadTrace()
        this.buildTimeMs = Date.now() - t0
    }


    computeCoords(entities: Entity[]) {

        for (const node of this.graph.nodes()) {
            
            const event = this.graph.getNodeAttribute(node, 'event')
            const x = this.trace.events.indexOf(event) * 5

            const entityName = this.graph.getNodeAttribute(node, 'entity')
            const y = -entities.indexOf(entityName) * 50

            this.graph.setNodeAttribute(node, 'x', x)
            this.graph.setNodeAttribute(node, 'y', y)
        }
    }


    loadTrace() {
        const nodesByEntity = new Map<Entity, string[]>()
        this.createInitialNodes(nodesByEntity)
        this.loadEvents(nodesByEntity)
        
        for (const node of this.graph.nodes()) {
            this.graph.setNodeAttribute(node, 'color', '#000000')
        }
    }


    createInitialNodes(nodesByEntity: Map<Entity, string[]>) {

        for (const resource of this.trace.resources) {

            const nodeLabel = `${resource.path}-0`
            const node = this.graph.addNode(nodeLabel, {
                x: 0, 
                y: 0, 
                size: 4,
                label: nodeLabel, 
                version: 0, 
                entity: resource, 
                event: null,
                type: 'square'
            })
            nodesByEntity.set(resource, [node])
        }

        for (const process of this.trace.processes) {

            const processUUID = process.getUUID()
            const nodeLabel = `${processUUID}-0`
            const node = this.graph.addNode(nodeLabel, {
                x: 0, 
                y: 0, 
                size: 4,
                label: nodeLabel, 
                version: 0, 
                entity: process, 
                event: null, 
                type: 'circle'
            })
            nodesByEntity.set(process, [node])
        }
    }


    getLastNodeForEntity(entity: Entity, nodesByEntity: Map<Entity, string[]>): string | null {
        const nodes = nodesByEntity.get(entity)
        if (!nodes) {
            console.error(`[FATAL] No nodes found for entity ${entity}`)
            console.error('This should never happen as all entities are initialized at the start of the provenance graph construction.')
            return null
        }
        
        return nodes[nodes.length - 1]
    }


    loadEvents(nodesByEntity: Map<Entity, string[]>) {
        for (const event of this.trace.events) {
            this.addEventToGraph(event, nodesByEntity)
        }
    }


    addNewNodeForEntity(entityLastNode: string, event: Event, nodesByEntity: Map<Entity, string[]>): string {

        const entity = this.graph.getNodeAttribute(entityLastNode, 'entity') as Entity
        const lastVersion = this.graph.getNodeAttribute(entityLastNode, 'version') as number
        const newVersion = lastVersion + 1
        const entityUUID = entity.getUUID()
        const newNodeLabel = `${entityUUID}-${newVersion}`

        const newNode = this.graph.addNode(newNodeLabel, {
            x: 0,
            y: 0,
            size: 4,
            label: newNodeLabel,
            version: newVersion,
            entity: entity,
            event: event,
            type: this.graph.getNodeAttribute(entityLastNode, 'type')
        })

        const entityNodes = nodesByEntity.get(entity)
        if (!entityNodes) {
            console.error(`[FATAL] No nodes found for entity ${entity}`)
            console.error('This should never happen as all entities are initialized at the start of the provenance graph construction.')
            return newNode
        }
        entityNodes.push(newNode)

        return newNode;
    }


    addEventToGraph(event: Event, nodesByEntity: Map<Entity, string[]>) {
        
        const sourceEntities = Array.from(event.sourceEntities)
        const targetEntities = Array.from(event.targetEntities)

        let sourceNodes: string[] = [];
        for (const sourceEntity of sourceEntities) {
            const sourceEntityLastNode = this.getLastNodeForEntity(sourceEntity, nodesByEntity)
            if (!sourceEntityLastNode) {
                console.error(`[FATAL] Could not find last node for source entity ${sourceEntity} in event ${event}.`)
                continue
            }
            sourceNodes.push(sourceEntityLastNode)
        }

        let targetNodes: string[] = [];
        for (const targetEntity of targetEntities) {
            const targetEntityLastNode = this.getLastNodeForEntity(targetEntity, nodesByEntity)
            if (!targetEntityLastNode) {
                console.error(`[FATAL] Could not find last node for target entity ${targetEntity} in event ${event}.`)
                continue
            }

            const newNode = this.addNewNodeForEntity(targetEntityLastNode, event, nodesByEntity)

            targetNodes.push(newNode)
        }

        const color = event.color
        for ( const sourceNode of sourceNodes ) {
            for ( const targetNode of targetNodes ) {
                const edgeLabel = event.id
                this.graph.addEdge(sourceNode, targetNode, {
                    label: edgeLabel,
                    color: color,
                    event: event
                })
            }
        }
    }
}