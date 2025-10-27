
import DirectedGraph from 'graphology'
import FA2Layout from "graphology-layout-forceatlas2"

import { ExecutionTrace } from "./ExecutionTrace/ExecutionTrace"
import { EnterReadEvent, Event, CloseEvent, ExitReadEvent, FSEvent, OpenEvent, WriteEvent } from "./types"
import { toUniform, IClonable } from "./utils"


export class TopologyGraph implements IClonable<TopologyGraph> {

    graph: DirectedGraph
    trace: ExecutionTrace
    traceName: string;
    currentEvent: Event 

    // shouldInit is used to make more efficient copies
    private constructor(trace: ExecutionTrace, shouldInit: boolean) {
        this.trace = trace
        this.graph = new DirectedGraph()
        this.traceName = trace.filename.split('/').pop() || ""
        this.currentEvent = trace.events[0]

        if ( shouldInit ) {
            this.graph = this.computeGraphFromTrace()

            this.setEventFilepaths()

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

    computeGraphFromTrace(): DirectedGraph {

        const graph = new DirectedGraph();

        for (const file of this.trace.resources) {
            const fileLabel = file.path;
            graph.addNode(fileLabel, {
                x: toUniform(fileLabel)*10,
                y: toUniform(fileLabel+'1')*10,
                size: 10,
                color: "green",
                label: fileLabel,
                objectName: fileLabel,
                group: 'Files'
            });
        }
    
        for (const process of this.trace.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { 
                x: toUniform(processLabel)*10,
                y: toUniform(processLabel+'1')*10,
                size: 10,
                color: "red",
                label: processLabel,
                objectName: processLabel,
                group: 'Processes'
            });
        }

        for (const event of this.trace.events) {
            if ( (event instanceof EnterReadEvent ||
                event instanceof ExitReadEvent ||
                event instanceof WriteEvent) && event.fd === 1
            ) {
                const processLabel = event.process.getUUID();
                // TODO: fd = 1 is always STDOUT
                const nodeLabel = `${processLabel}-STDOUT`;
                if (!graph.hasNode(nodeLabel)) {
                    graph.addNode(nodeLabel, { 
                        x: toUniform(nodeLabel)*10,
                        y: toUniform(nodeLabel+'1')*10,
                        size: 10,
                        color: "blue",
                        label: nodeLabel,
                        objectName: nodeLabel,
                        group: 'Channels'
                    });
                }
                
                if ( !graph.hasEdge(processLabel, nodeLabel) ) {
                    const edge = graph.addEdge(processLabel, nodeLabel, { 
                        size: 3, 
                        color: "black", 
                        type: 'arrow', 
                        label: '', 
                        forceLabel: true 
                    });
                    graph.setEdgeAttribute(edge, "definitive", true);
                    graph.setEdgeAttribute(edge, "fd", 1);
                    graph.setEdgeAttribute(edge, "isOpened", true);            
                }
            }   
        } 

        FA2Layout.assign(graph, {iterations: 50});

        return graph
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

        TopologyGraph.cleanGraph(graph);
    
        let highlightCallback = () => {};
    
        for (const event of this.trace.events) {
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
        const eventIndex = this.trace.events.indexOf(event)

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


    setEventFilepaths() {

        const tmpGraph = this.graph.copy()
        TopologyGraph.cleanGraph(tmpGraph)

        for (const event of this.trace.events) {
            if ( ! (event instanceof FSEvent) ) {
                console.error(`Can only set filename for FSEvent, got ${event}`)
                continue
            }
            const filename1 = TopologyGraph.getEventFilename(event, tmpGraph)
            this.applyEventToGraph(event, tmpGraph)
            const filename2 = TopologyGraph.getEventFilename(event, tmpGraph)
            event.filepath = filename1 || filename2 || "Error"
            //TODO: instead of just resource name, shoulkd point to the resource struct
        }
    }
    

    toJSON(hiddenObjects: string[]): string {

        const removeFile = (path: string, trace: ExecutionTrace) => {
            trace.resources = trace.resources.filter(f => f.path !== path)
            trace.events = trace.events.filter(e => (e as FSEvent).filepath !== path)
        }

        const removeProcess = (processUUID: string, trace: ExecutionTrace) => {
            trace.processes = trace.processes.filter(p => p.getUUID() !== processUUID)
            trace.events = trace.events.filter(e => e.process.getUUID() !== processUUID)
        }

        const modifiedTrace = this.trace.clone()
        const graph = this.graph

        for (const objectName of hiddenObjects) {
            const node = graph.filterNodes((_, nodeAttribs) => nodeAttribs.objectName === objectName)[0]
            const group = graph.getNodeAttribute(node, 'group')
            if ( group === 'Processes' ){
                removeProcess(node, modifiedTrace)
            } else if ( group === 'Files'){
                removeFile(node, modifiedTrace)
            } else if ( group === 'Channels'){
                removeFile(node, modifiedTrace)
            }
        }

        return ExecutionTrace.toJSON(modifiedTrace)
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
}