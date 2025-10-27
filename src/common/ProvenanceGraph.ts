
import DirectedGraph from 'graphology'

import { CausalLink, EventPattern, PatternValue, SourceTargetCL } from './causality'
import { ExecutionTrace } from './ExecutionTrace/ExecutionTrace'
import { ExitReadEvent, WriteEvent, Event, OpenEvent, CloseEvent } from './types'



class ProvenanceGraph {

    trace: ExecutionTrace
    graph: DirectedGraph
    events: Event[]
    nodes: Map<string, string[]>
    excludedNodes: Set<string>

    eventCausalLinks: Map<Event, CausalLink[]>
    testCausalLink: CausalLink[]
    testSource: EventPattern[]

    constructor(trace: ExecutionTrace) {
        this.trace = trace
        this.graph = new DirectedGraph()
        this.events = []
        this.nodes = new Map<string, string[]>()
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


    computeCoords(objectNames: string[]) {

        for (const node of this.graph.nodes()) {
            
            const event = this.graph.getNodeAttribute(node, 'event')
            const x = this.events.indexOf(event) * 5

            const objectName = this.graph.getNodeAttribute(node, 'objectName')
            const y = -objectNames.indexOf(objectName) * 50

            this.graph.setNodeAttribute(node, 'x', x)
            this.graph.setNodeAttribute(node, 'y', y)
        }
    }


    loadTrace() {

        this.createInitialNodes()
        this.loadEvents()
    }


    createInitialNodes() {

        for (const file of this.trace.files) {

            const node = this.graph.addNode(file.path, {
                x: 0, 
                y: 0, 
                size: 4,
                label: file.path, 
                version: 0, 
                objectName: file.path, 
                event: null, 
                type: 'square'
            })
            this.nodes.set(file.path, [node])
        }

        for (const process of this.trace.processes) {

            const processUUID = process.getUUID()
            const node = this.graph.addNode(processUUID, {
                x: 0, 
                y: 0, 
                size: 4,
                label: processUUID, 
                version: 0, 
                objectName: processUUID, 
                event: null, 
                type: 'circle'
            })
            this.nodes.set(processUUID, [node])

            const stdoutName = `${process.getUUID()}-STDOUT`
            const stdoutNode = this.graph.addNode(stdoutName, {
                x: 0, 
                y: 0, 
                size: 4,
                label: stdoutName, 
                version: 0, 
                objectName: stdoutName, 
                event: null, 
                type: 'square'
            })
            this.nodes.set(stdoutName, [stdoutNode])
        }
    }


    loadEvents() {
        
        const allEvent = this.trace.events

        for (const event of allEvent) {
            if (event instanceof ExitReadEvent) {
                this.addReadEvent(event)
                this.events.push(event)
            } else if (event instanceof WriteEvent) {
                this.addWriteEvent(event)
                this.events.push(event)
            } else if (event instanceof OpenEvent) {
                this.addOpenEvent(event)
                this.events.push(event)
            } else if (event instanceof CloseEvent) {
                this.addCloseEvent(event)
                this.events.push(event)
            } else {
                console.log(`${event} not handled by ProvenanceGraph`)
            }
        }
    }


    //TODO check if OpenEvent indeed created a new file
    addCloseEvent(event: CloseEvent) {
        const processUUID = event.process.getUUID()
        const id = event.id

        const processNodes = this.nodes.get(processUUID)!
        const lastProcessNode = processNodes.slice(-1)[0]
        const currentProcessVersion = processNodes.length - 1

        const newProcessNodeLabel = `${processUUID}-${currentProcessVersion + 1}`
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newProcessNodeLabel, 
            version: currentProcessVersion + 1, 
            objectName: processUUID, 
            objectType: "process",
            event: event, 
            type: 'circle'
        })
        this.nodes.get(processUUID)!.push(newProcessNode)

        this.graph.addEdge(lastProcessNode, newProcessNode, {event: event, color: 'black'})
    }


    //TODO check if OpenEvent indeed created a new file
    addOpenEvent(event: OpenEvent) {
        const processUUID = event.process.getUUID()
        const filePath = event.filepath
        const id = event.id
        if (!filePath) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNodes = this.nodes.get(filePath)!
        const lastResourceNode = fileNodes.slice(-1)[0]
        // const currentResourceVersion = fileNodes.length - 1

        const processNodes = this.nodes.get(processUUID)!
        const lastProcessNode = processNodes.slice(-1)[0]
        const currentProcessVersion = processNodes.length - 1

        // const newResourceNodeLabel = `${filePath}-${currentResourceVersion + 1}`
        // const newResourceNode = this.graph.addNode(newResourceNodeLabel, {
        //     x: 0, 
        //     y: 0, 
        //     id: id,
        //     size: 4,
        //     label: newResourceNodeLabel, 
        //     version: currentResourceVersion + 1, 
        //     objectName: filePath, 
        //     objectType: "resource",
        //     event: event, 
        //     type: 'square'
        // })
        // this.nodes.get(filePath)!.push(newResourceNode)

        const newProcessNodeLabel = `${processUUID}-${currentProcessVersion + 1}`
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newProcessNodeLabel, 
            version: currentProcessVersion + 1, 
            objectName: processUUID, 
            objectType: "process",
            event: event, 
            type: 'circle'
        })
        this.nodes.get(processUUID)!.push(newProcessNode)

        this.graph.addEdge(lastResourceNode, newProcessNode, {event: event, color: 'yellow'})
        this.graph.addEdge(lastProcessNode, newProcessNode, {event: event, color: 'yellow'})
    }


    //TODO handle read on consumable vs storage resources
    addReadEvent(event: ExitReadEvent) {
        const processUUID = event.process.getUUID()
        const filePath = event.filepath
        const id = event.id
        if (!filePath) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNodes = this.nodes.get(filePath)!
        const lastResourceNode = fileNodes.slice(-1)[0]
        const currentResourceVersion = fileNodes.length - 1

        const processNodes = this.nodes.get(processUUID)!
        const lastProcessNode = processNodes.slice(-1)[0]
        const currentProcessVersion = processNodes.length - 1

        const newResourceNodeLabel = `${filePath}-${currentResourceVersion + 1}`
        const newResourceNode = this.graph.addNode(newResourceNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newResourceNodeLabel, 
            version: currentResourceVersion + 1, 
            objectName: filePath, 
            objectType: "resource",
            event: event, 
            type: 'square'
        })
        this.nodes.get(filePath)!.push(newResourceNode)

        const newProcessNodeLabel = `${processUUID}-${currentProcessVersion + 1}`
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newProcessNodeLabel, 
            version: currentProcessVersion + 1, 
            objectName: processUUID, 
            objectType: "process",
            event: event, 
            type: 'circle'
        })
        this.nodes.get(processUUID)!.push(newProcessNode)

        this.graph.addEdge(lastResourceNode, newResourceNode, {event: event, color: 'green'})
        this.graph.addEdge(lastResourceNode, newProcessNode, {event: event, color: 'green'})
        this.graph.addEdge(lastProcessNode, newResourceNode, {event: event, color: 'green'})
        this.graph.addEdge(lastProcessNode, newProcessNode, {event: event, color: 'green'})
    }


    addWriteEvent(event: WriteEvent) {
        const processUUID = event.process.getUUID()
        const filePath = event.filepath
        const id = event.id
        if (!filePath) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNodes = this.nodes.get(filePath)!
        const lastResourceNode = fileNodes.slice(-1)[0]
        const currentResourceVersion = fileNodes.length - 1

        const processNodes = this.nodes.get(processUUID)!
        const lastProcessNode = processNodes.slice(-1)[0]
        const currentProcessVersion = processNodes.length - 1

        const newResourceNodeLabel = `${filePath}-${currentResourceVersion + 1}`
        const newResourceNode = this.graph.addNode(newResourceNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newResourceNodeLabel, 
            version: currentResourceVersion + 1, 
            objectName: filePath, 
            objectType: "resource",
            event: event, 
            type: 'square'
        })
        this.nodes.get(filePath)!.push(newResourceNode)

        const newProcessNodeLabel = `${processUUID}-${currentProcessVersion + 1}`
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newProcessNodeLabel, 
            version: currentProcessVersion + 1, 
            objectName: processUUID, 
            objectType: "process",
            event: event, 
            type: 'circle'
        })
        this.nodes.get(processUUID)!.push(newProcessNode)

        this.graph.addEdge(lastResourceNode, newResourceNode, {event: event, color: 'blue'})
        this.graph.addEdge(lastResourceNode, newProcessNode, {event: event, color: 'blue'})
        this.graph.addEdge(lastProcessNode, newResourceNode, {event: event, color: 'blue'})
        this.graph.addEdge(lastProcessNode, newProcessNode, {event: event, color: 'blue'})
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
        this.graph.forEachEdge((edge, attr) => {
            const event = attr.event
            if (!event) return

            if (event instanceof WriteEvent) {
                this.graph.setEdgeAttribute(edge, 'color', 'blue')
            } else if (event instanceof ExitReadEvent) {
                this.graph.setEdgeAttribute(edge, 'color', 'green')
            }
        })

        this.graph.forEachNode((node, _attr) => {
            this.graph.removeNodeAttribute(node, 'color')
        });
    }
}


export default ProvenanceGraph;