
import DirectedGraph from 'graphology'

import { CausalLink, EventPattern, PatternValue, SourceTargetCL } from './causality'
import { ExecutionTrace } from './ExecutionTrace/ExecutionTrace'
import { Entity, Event } from './types'



class ProvenanceGraph {

    trace: ExecutionTrace
    graph: DirectedGraph
    nodes: Map<Entity, string[]>
    excludedNodes: Set<string>

    eventCausalLinks: Map<Event, CausalLink[]>
    testCausalLink: CausalLink[]
    testSource: EventPattern[]

    constructor(trace: ExecutionTrace) {
        this.trace = trace
        this.graph = new DirectedGraph()
        this.nodes = new Map<Entity, string[]>()
        this.excludedNodes = new Set<string>()
        this.eventCausalLinks = new Map<Event, CausalLink[]>()

        const routerProcess = trace.processes.find(p => p.name === 'router.bin' && p.pid === 26607);
        this.testCausalLink = [
            new SourceTargetCL(
                new EventPattern(new Map<string, PatternValue>([
                    ['eventType', new PatternValue('ExitReadEvent')],
                    ['process', new PatternValue(routerProcess)],
                    ['filepath', new PatternValue('run/client1_r')],
                ])),
                new EventPattern(new Map<string, PatternValue>([
                    ['eventType', new PatternValue('WriteEvent')],
                    ['process', new PatternValue(routerProcess)],
                    ['filepath', new PatternValue('run/logs_1')],
                ]))
            ),
        ]

        const clientProcess = this.trace.processes.find(p => p.name === 'client.bin' && p.pid === 26609);
        this.testSource = [
            new EventPattern(new Map<string, PatternValue>([
                ['process', new PatternValue(clientProcess)],
            ]))
        ]

        this.loadTrace()
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
        this.createInitialNodes()
        this.loadEvents()
    }


    createInitialNodes() {

        for (const resource of this.trace.resources) {

            const node = this.graph.addNode(resource.path, {
                x: 0, 
                y: 0, 
                size: 4,
                label: `${resource.path}-0`, 
                version: 0, 
                entity: resource, 
                event: null, 
                type: 'square'
            })
            this.nodes.set(resource, [node])
        }

        for (const process of this.trace.processes) {

            const processUUID = process.getUUID()
            const node = this.graph.addNode(processUUID, {
                x: 0, 
                y: 0, 
                size: 4,
                label: `${processUUID}-0`, 
                version: 0, 
                entity: process, 
                event: null, 
                type: 'circle'
            })
            this.nodes.set(process, [node])
        }
    }


    getLastNodeForEntity(entity: Entity): string | null {
        const nodes = this.nodes.get(entity)
        if (!nodes) {
            console.error(`[FATAL] No nodes found for entity ${entity}`)
            console.error('This should never happen as all entities are initialized at the start of the provenance graph construction.')
            return null
        }
        
        return nodes[nodes.length - 1]
    }


    loadEvents() {
        for (const event of this.trace.events) {
            this.addEventToGraph(event)
        }
    }


    addNewNodeForEntity(entityLastNode: string, event: Event): string {

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

        const entityNodes = this.nodes.get(entity)
        if (!entityNodes) {
            console.error(`[FATAL] No nodes found for entity ${entity}`)
            console.error('This should never happen as all entities are initialized at the start of the provenance graph construction.')
            return newNode
        }
        entityNodes.push(newNode)

        return newNode;
    }


    addEventToGraph(event: Event) {
        
        const sourceEntities = Array.from(event.sourceEntities)
        const targetEntities = Array.from(event.targetEntities)

        let sourceNodes: string[] = [];
        for (const sourceEntity of sourceEntities) {
            const sourceEntityLastNode = this.getLastNodeForEntity(sourceEntity)
            if (!sourceEntityLastNode) {
                console.error(`[FATAL] Could not find last node for source entity ${sourceEntity} in event ${event}.`)
                continue
            }
            sourceNodes.push(sourceEntityLastNode)
        }

        let targetNodes: string[] = [];
        for (const targetEntity of targetEntities) {
            const targetEntityLastNode = this.getLastNodeForEntity(targetEntity)
            if (!targetEntityLastNode) {
                console.error(`[FATAL] Could not find last node for target entity ${targetEntity} in event ${event}.`)
                continue
            }
            
            const newNode = this.addNewNodeForEntity(targetEntityLastNode, event)

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


    computeProvenanceFrom(node: string): Set<string> {

        const event = this.graph.getNodeAttribute(node, 'event') as Event
        if (!event) {
            console.error(`Node ${node} does not have an event attribute`)
            return new Set<string>()
        }

        const provenance = new Set<Event>()
        const queue: Event[] = [event]
        while (queue.length > 0) {
            const current = queue.shift()
            if (!current) continue

            provenance.add(current)

            const causes = this.getCausesOfEvent(current)
            for (const cause of causes) {
                if (!provenance.has(cause)) {
                    queue.push(cause)
                }
            }
        }

        const nodesInProvenance: Set<string> = new Set<string>();
        for (const event of provenance) {
            const node = this.graph.findNode((n) => this.graph.getNodeAttribute(n, 'event') == event);
            if (node) {
                nodesInProvenance.add(node);
            }
        }
        return nodesInProvenance;
    }


    getCausesOfEvent(event: Event): Set<Event> {

        for( const sourcePattern of this.testSource ) {
            if (sourcePattern.matches(event)) {
                console.debug("Source pattern matched for event", event);
                return new Set<Event>();
            }
        }

        const causes: Set<Event> = new Set<Event>();
        const causalLinks = this.testCausalLink
    
        for (const causalLink of causalLinks) {
            const partialCauses = causalLink.getCauses(event, this)
            partialCauses.forEach(cause => causes.add(cause))
        }

        const node = this.graph.findNode((n) => this.graph.getNodeAttribute(n, 'event') == event);
        const parents = this.graph.inNeighbors(node);

        parents.forEach((parent) => {
            if (this.graph.getNodeAttribute(parent, 'objectType') === 'resource') {
                const parentEvent = this.graph.getNodeAttribute(parent, 'event');
                if (parentEvent) {
                    causes.add(parentEvent);
                    this.graph.inNeighbors(parent).forEach((gp) => {
                        if (this.graph.getNodeAttribute(gp, 'objectType') === 'process') {
                            const grandparentEvent = this.graph.getNodeAttribute(gp, 'event');
                            if (grandparentEvent) {
                                causes.add(grandparentEvent);
                            }
                        }
                    });
                }
            }
        });

        return causes
    }
    

    resetColoring() {
        this.graph.forEachNode((node, _attr) => {
            this.graph.removeNodeAttribute(node, 'color')
        });
    }
}


export default ProvenanceGraph;