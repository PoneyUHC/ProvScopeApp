
import DirectedGraph from 'graphology'

import { CausalLink, EventPattern, PatternValue, SourceTargetCL } from '@common/causality'
import { ExitReadEvent, ExecutionTrace, WriteEvent, Event } from '@common/types'



class DataflowGraph {

    trace: ExecutionTrace
    graph: DirectedGraph
    events: Event[]
    versions: Map<string, number>
    nodes: Map<string, string[]>
    excludedNodes: Set<string>

    eventCausalLinks: Map<Event, CausalLink[]>
    testCausalLink: CausalLink[]
    testSource: EventPattern[]

    constructor(trace: ExecutionTrace) {
        this.trace = trace
        this.graph = new DirectedGraph()
        this.events = []
        this.versions = new Map<string, number>()
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
            this.versions.set(file.path, 0)
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
            this.versions.set(processUUID, 0)

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
            this.versions.set(stdoutName, 0)
        }

        this.loadEvents()
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
            } else {
                console.log(`${event} not handled by DataflowGraph`)
            }
        }
    }

    
    addReadEvent(event: ExitReadEvent) {
        
        const processUUID = event.process.getUUID()
        const filePath = event.filepath
        const id = event.id
        if (!filePath) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNodes = this.nodes.get(filePath)
        const fileNode = fileNodes ? fileNodes[fileNodes.length - 1] : null
        const processNodes = this.nodes.get(processUUID)
        const processNode = processNodes ? processNodes[processNodes.length - 1] : null
        if (!fileNode || !processNode) {
            console.error(`File node or process node not found for event`)
            console.error(event)
            return
        }

        let currentVersion = this.versions.get(processUUID)
        if (currentVersion === undefined) {
            console.error(`Process version not found for event`)
            console.error(event)
            return
        }

        const nextVersion = currentVersion + 1
        this.versions.set(processUUID, nextVersion)

        const newProcessNodeLabel = `${processUUID}-${nextVersion}`
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {
            x: 0, 
            y: 0,
            size: 4,
            id: id,
            label: newProcessNodeLabel, 
            version: nextVersion, 
            objectName: processUUID, 
            event: event,
            objectType: "process", 
            type: 'circle'
        })
        this.nodes.get(processUUID)?.push(newProcessNode)

        this.graph.addEdge(fileNode, newProcessNode, {event: event, color: 'green'})
        this.graph.addEdge(processNode, newProcessNode, {event: event, color: 'green'})
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

        const fileNodes = this.nodes.get(filePath)
        const fileNode = fileNodes ? fileNodes[fileNodes.length - 1] : null
        const processNodes = this.nodes.get(processUUID)
        const processNode = processNodes ? processNodes[processNodes.length - 1] : null
        if (!fileNode || !processNode) {
            console.log(event.filepath)
            console.error(event)
            return
        }

        const currentVersion = this.versions.get(filePath)
        if (currentVersion === undefined) {
            console.error(`File version not found for event`)
            console.error(event)
            return
        }

        const nextVersion = currentVersion + 1
        this.versions.set(filePath, nextVersion)

        const newFileNodeLabel = `${filePath}-${nextVersion}`
        const newFileNode = this.graph.addNode(newFileNodeLabel, {
            x: 0, 
            y: 0, 
            id: id,
            size: 4,
            label: newFileNodeLabel, 
            version: nextVersion, 
            objectName: filePath, 
            objectType: "resource",
            event: event, 
            type: 'square'
        })
        this.nodes.get(filePath)?.push(newFileNode)

        this.graph.addEdge(fileNode, newFileNode, {event: event, color: 'blue'})
        this.graph.addEdge(processNode, newFileNode, {event: event, color: 'blue'})
    }


    computeDataflowFrom(node: string): Set<string> {

        const event = this.graph.getNodeAttribute(node, 'event') as Event
        if (!event) {
            console.error(`Node ${node} does not have an event attribute`)
            return new Set<string>()
        }

        const dataflow = new Set<Event>()
        const queue: Event[] = [event]
        while (queue.length > 0) {
            const current = queue.shift()
            if (!current) continue

            dataflow.add(current)

            const causes = this.getCausesOfEvent(current)
            for (const cause of causes) {
                if (!dataflow.has(cause)) {
                    queue.push(cause)
                }
            }
        }

        const nodesInDataflow: Set<string> = new Set<string>();
        for (const event of dataflow) {
            const node = this.graph.findNode((n) => this.graph.getNodeAttribute(n, 'event') == event);
            if (node) {
                nodesInDataflow.add(node);
            }
        }
        return nodesInDataflow;
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


    setNodeVersionsVisibility(node: string, visible: boolean) {

        const nodes = this.nodes.get(node)
        if (!nodes) {
            console.error(`Node ${node} not found`)
            return
        }

        for (const n of nodes.slice(1)) {
            this.graph.setNodeAttribute(n, 'hidden', !visible)
        }
    }


    toggleVisible(node: string) {

        const objectName = this.graph.getNodeAttribute(node, 'objectName')

        if (this.excludedNodes.has(objectName)) {
            this.excludedNodes.delete(objectName)
            this.setNodeVersionsVisibility(objectName, true)
        }
        else {
            this.excludedNodes.add(node)
            this.setNodeVersionsVisibility(objectName, false)
        }
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


export default DataflowGraph;