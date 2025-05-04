
import DirectedGraph from 'graphology'
import { ExitReadEvent, IPCTrace, WriteEvent } from './types'
import { IPCTraceGraph } from './IPCTraceGraph'



class DataflowGraph {

    graph: DirectedGraph
    versions: Map<string, number>
    lastNodes: Map<string, string>

    constructor(trace: Readonly<IPCTrace>) {
        this.graph = new DirectedGraph()
        this.versions = new Map<string, number>()
        this.lastNodes = new Map<string, string>()

        this.loadTrace(trace)
    }


    computeCoords(node: string, version: number): { x: number, y: number } {

        console.log(node)

        const x = Array.from(this.lastNodes.keys()).indexOf(node)
        console.log(x)
        const y = version
        
        return { x, y }
    }



    loadTrace(trace: IPCTrace) {

        const traceGraph = IPCTraceGraph.create(trace)

        for (const file of trace.files) {

            // positions map to get x coord
            // then compuite y coord thanks to versions later

            const node = this.graph.addNode(file.path, {...this.computeCoords(file.path, 0), label: file.path})
            this.lastNodes.set(file.path, node)
            this.versions.set(file.path, 0)
        }

        for (const process of trace.processes) {

            const processUUID = process.getUUID()
            const node = this.graph.addNode(processUUID, {...this.computeCoords(processUUID, 0), label: processUUID})
            this.lastNodes.set(processUUID, node)
            this.versions.set(processUUID, 0)

            const stdoutName = `${process.getUUID()}-STDOUT`
            const stdoutNode = this.graph.addNode(stdoutName, {...this.computeCoords(stdoutName, 0), label: stdoutName})
            this.lastNodes.set(stdoutName, stdoutNode)
            this.versions.set(stdoutName, 0)
        }

        this.loadEvents(traceGraph)
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
        const file = traceGraph.eventFilenameLookup.get(event)
        if (!file) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNode = this.lastNodes.get(file)
        const processNode = this.lastNodes.get(processUUID)
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
        const newProcessNode = this.graph.addNode(newProcessNodeLabel, {...this.computeCoords(processUUID, nextVersion), label: newProcessNodeLabel})
        this.lastNodes.set(processUUID, newProcessNode)

        this.graph.addEdge(fileNode, newProcessNode)
        this.graph.addEdge(processNode, newProcessNode)
    }

    
    addWriteEvent(event: WriteEvent, traceGraph: IPCTraceGraph) {
        const process = event.process.getUUID()
        const file = traceGraph.eventFilenameLookup.get(event)
        if (!file) {
            console.error(`File not found for event`)
            console.error(event)
            return
        }

        const fileNode = this.lastNodes.get(file)
        const processNode = this.lastNodes.get(process)
        if (!fileNode || !processNode) {
            console.log(traceGraph.eventFilenameLookup.get(event))
            console.error(event)
            return
        }

        const currentVersion = this.versions.get(file)
        if (currentVersion === undefined) {
            console.error(`File version not found for event`)
            console.error(event)
            return
        }

        const nextVersion = currentVersion + 1
        this.versions.set(file, nextVersion)

        const newFileNodeLabel = `${file}-${nextVersion}`
        const newFileNode = this.graph.addNode(newFileNodeLabel, {...this.computeCoords(file, nextVersion), label: newFileNodeLabel})
        this.lastNodes.set(file, newFileNode)

        this.graph.addEdge(fileNode, newFileNode)
        this.graph.addEdge(processNode, newFileNode)
    }
}


export default DataflowGraph;