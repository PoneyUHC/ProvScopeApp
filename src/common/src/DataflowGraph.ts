
import DirectedGraph from 'graphology'
import { ExitReadEvent, IPCTrace, WriteEvent } from './types'
import { IPCTraceGraph } from './IPCTraceGraph'
import { reverse } from 'graphology-operators'
import { bfsFromNode } from 'graphology-traversal'



class DataflowGraph {

    graph: DirectedGraph
    trace: IPCTrace
    versions: Map<string, number>
    nodes: Map<string, string[]>
    excludedNodes: Set<string>

    constructor(trace: Readonly<IPCTrace>) {
        this.graph = new DirectedGraph()
        this.trace = trace
        this.versions = new Map<string, number>()
        this.nodes = new Map<string, string[]>()
        this.excludedNodes = new Set<string>()

        this.loadTrace(trace)
    }


    computeCoords(){

        for (const node of this.graph.nodes()) {
            
            const event = this.graph.getNodeAttribute(node, 'event')
            const x = this.trace.events.indexOf(event) * 5

            const objectName = this.graph.getNodeAttribute(node, 'objectName')
            const y = Array.from(this.nodes.keys()).indexOf(objectName) * 5

            this.graph.setNodeAttribute(node, 'x', x)
            this.graph.setNodeAttribute(node, 'y', y)
        }
    }



    loadTrace(trace: IPCTrace) {

        const traceGraph = IPCTraceGraph.create(trace)

        for (const file of trace.files) {

            const node = this.graph.addNode(file.path, {x: 0, y: 0, label: file.path, version: 0, objectName: file.path, event: null, type: 'square'})
            this.nodes.set(file.path, [node])
            this.versions.set(file.path, 0)
        }

        for (const process of trace.processes) {

            const processUUID = process.getUUID()
            const node = this.graph.addNode(processUUID, {x: 0, y: 0, label: processUUID, version: 0, objectName: processUUID, event: null, type: 'circle'})
            this.nodes.set(processUUID, [node])
            this.versions.set(processUUID, 0)

            const stdoutName = `${process.getUUID()}-STDOUT`
            const stdoutNode = this.graph.addNode(stdoutName, {x: 0, y: 0, label: stdoutName, version: 0, objectName: stdoutName, event: null, type: 'square'})
            this.nodes.set(stdoutName, [stdoutNode])
            this.versions.set(stdoutName, 0)
        }

        this.loadEvents(traceGraph)
        this.computeCoords()
    }

    loadEvents(traceGraph: IPCTraceGraph) {
        
        const events = traceGraph.getEvents()

        for (const event of events) {
            if (event instanceof ExitReadEvent) {
                this.addReadEvent(event, traceGraph)
            } else if (event instanceof WriteEvent) {
                this.addWriteEvent(event, traceGraph)
            } else {
                console.log(`${event} not handled by DataflowGraph`)
            }
        }
    }

    addReadEvent(event: ExitReadEvent, traceGraph: IPCTraceGraph) {
        
        const processUUID = event.process.getUUID()
        const filePath = traceGraph.eventFilenameLookup.get(event)
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
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {x: 0, y: 0, label: newProcessNodeLabel, version: nextVersion, objectName: processUUID, event: event, type: 'circle'})
        this.nodes.get(processUUID)?.push(newProcessNode)

        this.graph.addEdge(fileNode, newProcessNode, {eventType: 'read', event: event, color: 'green'})
        this.graph.addEdge(processNode, newProcessNode, {eventType: 'read', event: event, color: 'green'})
    }

    
    addWriteEvent(event: WriteEvent, traceGraph: IPCTraceGraph) {
        const processUUID = event.process.getUUID()
        const filePath = traceGraph.eventFilenameLookup.get(event)
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
            console.log(traceGraph.eventFilenameLookup.get(event))
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
        const newFileNode = this.graph.addNode(newFileNodeLabel, {x: 0, y: 0, label: newFileNodeLabel, version: nextVersion, objectName: filePath, event: event, type: 'square'})
        this.nodes.get(filePath)?.push(newFileNode)

        this.graph.addEdge(fileNode, newFileNode, {eventType: 'write', event: event, color: 'blue'})
        this.graph.addEdge(processNode, newFileNode, {eventType: 'write', event: event, color: 'blue'})
    }


    computeDataflowFrom(node: string): Set<string> {

        const reversedGraph = reverse(this.graph)
        const dataflow = new Set<string>()

        bfsFromNode(reversedGraph, node, (node) => {
            dataflow.add(node)
        });

        return dataflow
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
}


export default DataflowGraph;