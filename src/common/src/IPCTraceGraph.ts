
import { EnterReadEvent, Event, CloseEvent, ExitReadEvent, FSEvent, IPCTrace, OpenEvent, WriteEvent } from "./types"

import DirectedGraph from 'graphology'
import { toUniform, IClonable } from "./utils"

import FA2Layout from "graphology-layout-forceatlas2"


interface EventInfos {
    processUUID: string;
    dataTransfer: boolean;
    dataSource: string;
    dataDestination: string;
}


export class IPCTraceGraph implements IClonable<IPCTraceGraph> {

    private graph: DirectedGraph
    private ipcTrace: IPCTrace
    selectedNode: string
    selectedEvent: Event
    hiddenNodes: Set<string>
    hiddenEvents: Set<Event>

    eventFilenameLookup: Map<Event, string>

    // shouldInit is used to make more efficient copies
    private constructor(ipcTrace: IPCTrace, shouldInit: boolean) {
        this.ipcTrace = ipcTrace
        this.graph = new DirectedGraph()
        this.selectedNode = ipcTrace.events[0].process.getUUID()
        this.selectedEvent = ipcTrace.events[0]
        this.eventFilenameLookup = new Map<Event, string>()
        this.hiddenNodes = new Set<string>()
        this.hiddenEvents = new Set<Event>()

        if ( shouldInit ) {
            this.graph = this.computeGraphFromTrace()
            this.precomputeEventFilenames()
            this.applyUntilEvent(ipcTrace.events[0])
        }
    }

    // create instead of public constructor to avoid giving the user the ability to create 
    // non-initialized instances of the class
    static create(ipcTrace: IPCTrace): IPCTraceGraph {
        return new IPCTraceGraph(ipcTrace, true)
    }


    clone (): IPCTraceGraph {
        const other = new IPCTraceGraph(this.ipcTrace, false)
        other.graph = this.graph.copy()
        other.eventFilenameLookup = this.eventFilenameLookup

        other.selectedEvent = this.selectedEvent
        other.selectedNode = this.selectedNode
        other.hiddenNodes = new Set([...this.hiddenNodes])
        other.hiddenEvents = new Set([...this.hiddenEvents])
        other.applyUntilEvent(other.selectedEvent)        
        return other
    }


    getGraph = (): Readonly<DirectedGraph> => {
        return this.graph
    }


    // TODO: add visible events set for more efficient computation
    getEvents(): Event[] {
        return this.ipcTrace.events.filter(e => !this.hiddenEvents.has(e))
    }


    getTrace = (): Readonly<IPCTrace> => {
        return this.ipcTrace
    }


    getHiddenNodes(): Set<string> {
        return this.hiddenNodes
    }


    hideNode(node: string) {
        this.hiddenNodes.add(node)
        this.graph.setNodeAttribute(node, 'hidden', true)
    }


    showNode(node: string) {
        this.hiddenNodes.delete(node)
        this.graph.setNodeAttribute(node, 'hidden', false)
    }


    getHiddenEvents(): Set<Event> {
        return this.hiddenEvents
    }


    isNodeVisible(node: string): boolean {
        return ! this.hiddenNodes.has(node)
    }


    hideEvent(event: Event) {
        this.hiddenEvents.add(event)
    }


    showEvent(event: Event) {
        this.hiddenEvents.delete(event)
    }


    computeGraphFromTrace(): DirectedGraph {

        const graph = new DirectedGraph();

        for (const file of this.ipcTrace.files) {
            const fileLabel = file.path;
            graph.addNode(fileLabel, { x: toUniform(fileLabel)*10, y: toUniform(fileLabel+'1')*10, size: 10, color: "green", label: fileLabel, group: 'Files' });
        }
    
        for (const process of this.ipcTrace.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { x: toUniform(processLabel)*10, y: toUniform(processLabel+'1')*10, size: 10, color: "red", label: processLabel, group: 'Processes' });
        }

        for (const event of this.ipcTrace.events) {
            if ( (event instanceof EnterReadEvent ||
                event instanceof ExitReadEvent ||
                event instanceof WriteEvent) && event.fd === 1
            ) {
                const processLabel = event.process.getUUID();
                // TODO: fd = 1 is always STDOUT
                const nodeLabel = `${processLabel}-STDOUT`;
                if (!graph.hasNode(nodeLabel)) {
                    graph.addNode(nodeLabel, { x: toUniform(nodeLabel)*10, y: toUniform(nodeLabel+'1')*10, size: 10, color: "blue", label: nodeLabel, group: 'Channels' });
                }
                
                if ( !graph.hasEdge(processLabel, nodeLabel) ) {
                    const edge = graph.addEdge(processLabel, nodeLabel, { size: 3, color: "black", type: 'arrow', label: '', forceLabel: true });
                    graph.setEdgeAttribute(edge, "definitive", true);
                    graph.setEdgeAttribute(edge, "fd", 1);
                    graph.setEdgeAttribute(edge, "isOpened", true);            
                }
            }   
        } 

        FA2Layout.assign(graph, {iterations: 50});

        return graph
    }


    static getDataTransferInfos(event: Event, lookupGraph: DirectedGraph): EventInfos {

        const eventInfos = {} as EventInfos

        eventInfos.processUUID = event.process.getUUID()

        if ( event instanceof ExitReadEvent) {
            
            const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === eventInfos.processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened)
            const dataSource = lookupGraph.target(edge)
            eventInfos.dataTransfer = true
            eventInfos.dataSource = dataSource
            eventInfos.dataDestination = eventInfos.processUUID
        
        } else if ( event instanceof WriteEvent ) {

            const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === eventInfos.processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened)
            const dataDestination = lookupGraph.target(edge)
            eventInfos.dataTransfer = true
            eventInfos.dataSource = eventInfos.processUUID
            eventInfos.dataDestination = dataDestination

        } else {

            eventInfos.dataTransfer = false

        }

        return eventInfos
    }



    getBackwardEvents(targetEvent: Event): Event[] {
        
        const backwardCauses = [targetEvent]
        const nodesReached = new Set<string>()

        const tmpGraph = this.graph.copy()
        this.applyUntilEvent(targetEvent, tmpGraph)

        const eventInfos = IPCTraceGraph.getDataTransferInfos(targetEvent, tmpGraph)

        nodesReached.add(eventInfos.processUUID)
        if ( eventInfos.dataTransfer ){
            nodesReached.add(eventInfos.dataSource)
            nodesReached.add(eventInfos.dataDestination)
        }

        const startIndex = this.getEvents().indexOf(targetEvent)
        const previousEvents = this.getEvents().slice(0, startIndex).reverse()

        for( const event of previousEvents ) {
            
            this.applyUntilEvent(event, tmpGraph)
            const eventInfos = IPCTraceGraph.getDataTransferInfos(event, tmpGraph)
            
            if ( ! eventInfos.dataTransfer ){
                continue
            }

            if ( nodesReached.has(eventInfos.dataDestination) ) {
                nodesReached.add(eventInfos.dataSource)
                backwardCauses.push(event)
            }
        }

        return backwardCauses
    }



    backwardTraceFrom(targetEvent: Event): IPCTraceGraph {

        const backwardEvents = this.getBackwardEvents(targetEvent)

        console.log("there")
        console.log(backwardEvents)

        const clone = this.clone()
        const events = clone.getEvents()
        for( const event of events ) {
            if ( ! backwardEvents.includes(event) ){
                clone.hideEvent(event)
            }
        }
        console.log(clone.getHiddenEvents())
        console.log(clone.getEvents())
        console.log("here")
        return clone

    }


    static cleanGraph(graph: DirectedGraph) {
    
        for (const edge of graph.edges() ) {
            if( graph.getEdgeAttribute(edge, "definitive") ){
                graph.setEdgeAttribute(edge, "color", "black");
                graph.setEdgeAttribute(edge, "label", "");
            } else {
                graph.dropEdge(edge);
            }
        }
    }


    applyUntilEvent(targetEvent: Event, graph: DirectedGraph | null = null): void {

        if ( ! graph ){
            graph = this.graph
        }

        IPCTraceGraph.cleanGraph(graph);
    
        let highlightCallback = () => {};
    
        for (const event of this.ipcTrace.events) {
            highlightCallback = this.applyEventToGraph(event as FSEvent, graph);
            
            if (event === targetEvent) {
                highlightCallback();
                break;
            }
        }
    }


    applyEventToGraph(event: Event, graph: DirectedGraph) : () => void {

        let highlightCallback: () => void = () => {};

        const processUUID = event.process.getUUID();
        const eventIndex = this.ipcTrace.events.indexOf(event)

        if ( ! (event instanceof FSEvent) ) {
            console.error(`Can only apply FSEvent to graph, got ${event}`)
            return () => {}
        }

        if ( event instanceof OpenEvent ){

            const edge = graph.addEdge(processUUID, event.file.path, { size: 3, color: "blue", type: 'arrow', label: eventIndex.toString(), forceLabel: true });
            graph.setEdgeAttribute(edge, "fd", event.fd);
            graph.setEdgeAttribute(edge, "isOpened", true);

        } else if ( event instanceof CloseEvent ) {

            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            graph.setEdgeAttribute(edge, "color", "lightgrey");
            graph.setEdgeAttribute(edge, "isOpened", false);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());

        } else if ( event instanceof EnterReadEvent ) {

            let edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const color = graph.getEdgeAttribute(edge, "color");
            graph.setEdgeAttribute(edge, "previousColor", color);
            graph.setEdgeAttribute(edge, "color", "green");
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
        
        } else if ( event instanceof ExitReadEvent ) {
        
            let edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const previousColor = graph.getEdgeAttribute(edge, "previousColor");
            graph.setEdgeAttribute(edge, "color", previousColor);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "green");
        
        } else if ( event instanceof WriteEvent ) {

            let edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "red");

        }
    
        return highlightCallback
    }


    static getEventFilename(event: FSEvent, lookupGraph: DirectedGraph): string | null {
            
        const processUUID = event.process.getUUID();

        const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
        
        if ( ! edge ){
            return null
        }

        const filename = lookupGraph.target(edge)
        return filename
    }


    precomputeEventFilenames() {

        const tmpGraph = this.graph.copy()
        IPCTraceGraph.cleanGraph(tmpGraph)

        for (const event of this.ipcTrace.events) {
            const filename1 = IPCTraceGraph.getEventFilename(event as FSEvent, tmpGraph)
            this.applyEventToGraph(event as FSEvent, tmpGraph)
            const filename2 = IPCTraceGraph.getEventFilename(event as FSEvent, tmpGraph)
            this.eventFilenameLookup.set(event, filename1 || filename2 || "Error")
        }
    }

    
    toJSON() {

        const removeFile = (path: string, ipcTrace: IPCTrace) => {
            ipcTrace.files = ipcTrace.files.filter(f => f.path !== path)
            ipcTrace.events = ipcTrace.events.filter(e => this.eventFilenameLookup.get(e) !== path)
        }

        const removeProcess = (processUUID: string, ipcTrace: IPCTrace) => {
            ipcTrace.processes = ipcTrace.processes.filter(p => p.getUUID() !== processUUID)
            ipcTrace.events = ipcTrace.events.filter(e => e.process.getUUID() !== processUUID)
        }

        const modifiedIpcTrace = this.ipcTrace.clone()
        const graph = this.graph

        for (const node of this.hiddenNodes) {
            const group = graph.getNodeAttribute(node, 'group')
            if ( group === 'Processes' ){
                removeProcess(node, modifiedIpcTrace)
            } else if ( group === 'Files'){
                removeFile(node, modifiedIpcTrace)
            } else if ( group === 'Channels'){
                removeFile(node, modifiedIpcTrace)
            }
        }

        return IPCTrace.toJSON(modifiedIpcTrace)
    }


    getEventDescription(event: Event) {
    
        const processUUID = event.process.getUUID();

        if ( ! (event instanceof FSEvent) ) {
            return "Error: not a FSEvent"
        }

        const filename = this.eventFilenameLookup.get(event) || "Error"
        return `${processUUID} ${event.getKeyword()} ${filename}`
    }


    getNodesByGroup(): Map<string, string[]> {

        const nodesByGroup = new Map<string, string[]>()
        const graph = this.graph

        for (const node of graph.nodes()) {
            const group = graph.getNodeAttribute(node, 'group')
            if ( ! nodesByGroup.get(group) ){
                nodesByGroup.set(group, [])
            }
            nodesByGroup.get(group)!.push(node)
        }

        return nodesByGroup
    }


    highlightNode(node: string) {
        this.graph.setNodeAttribute(node, 'highlighted', true)
    }


    clearHighlights() {
        for (const n of this.graph.nodes()) {
            this.graph.setNodeAttribute(n, 'highlighted', false)
        }
    }

    setNodeVisibility(node: string, visible: boolean) {
        if ( visible ) {
            this.showNode(node)
        } else {
            this.hideNode(node)
        }
    }
}