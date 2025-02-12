
import { Component, RefObject } from 'react';

import '@react-sigma/core/lib/style.css';
import { DirectedGraph } from 'graphology';

import FA2Layout from "graphology-layout-forceatlas2"
import EventExplorerPanel from './EventExplorerPanel';

import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'
import { Sigma } from 'sigma';
import { SigmaEventPayload, SigmaNodeEventPayload } from 'sigma/types';

import { EnterReadEvent, ExitReadEvent, IPCInstance, WriteEvent, Event } from '../types.ts';
import { myHash } from '../utils.ts';


interface EventInfos {
    processUUID: string;
    dataTransfer: boolean;
    dataSource: string;
    dataDestination: string;
}

interface GraphPanelProps {
    className?: string;
    eventExplorerRef?: RefObject<EventExplorerPanel>
    onGraphLoaded?: (ipcInstance: IPCInstance) => void
}


interface GraphPanelState {
    currentGraph: DirectedGraph | null;
}


const getKeyword = {
    "OpenEvent" : "opens",
    "CloseEvent" : "closes",
    "EnterReadEvent" : "starts reading",
    "ExitReadEvent" : "ends reading",
    "WriteEvent" : "writes"
}


class GraphPanel extends Component<GraphPanelProps, GraphPanelState> {

    sigmaInstance: Sigma | null = null;
    didRegisterEvents: boolean = false
    draggedNode: string | null = null;
    
    completeGraph: DirectedGraph | null = null;
    ipcInstance: IPCInstance | null = null

    eventFilenameCache: Map<number, string> = new Map()

    constructor(props: GraphPanelProps) {
        super(props);
        this.state = {
            currentGraph: null
        }
    }


    onDownNode(event: SigmaNodeEventPayload) {

        const node = event.node

        this.draggedNode = node
        this.state.currentGraph?.setNodeAttribute(node, 'highlighted', true)

        if( ! this.sigmaInstance || ! this.draggedNode ){
            return
        }

        if (!this.sigmaInstance.getCustomBBox()){
            this.sigmaInstance.setCustomBBox(this.sigmaInstance.getBBox());
        }
    }


    onMouseMove(event: SigmaEventPayload){

        if( ! this.sigmaInstance || ! this.draggedNode ){
            return
        }

        const mouseCoords = event.event 
        const pos = this.sigmaInstance.viewportToGraph(mouseCoords)
        this.state.currentGraph?.setNodeAttribute(this.draggedNode, 'x', pos.x)
        this.state.currentGraph?.setNodeAttribute(this.draggedNode, 'y', pos.y)
        
        event.preventSigmaDefault()
        event.event.original.preventDefault()
        event.event.original.stopPropagation()
    }


    onMouseUp() {

        if ( this.draggedNode  ) {
            this.state.currentGraph?.removeNodeAttribute(this.draggedNode , 'highlighted')
            this.draggedNode = null
        }
    }


    registerGraphEvents() {

        if( ! this.sigmaInstance ) {
            return
        }

        this.sigmaInstance.on('downNode', (e) => this.onDownNode(e))
        this.sigmaInstance.on('moveBody', (e) => this.onMouseMove(e))
        this.sigmaInstance.on('upNode', () => this.onMouseUp())
        this.sigmaInstance.on('upStage', () => this.onMouseUp())
    }

    
    getRelatedFilename(event: any) {

        const graph = this.completeGraph
        const jsonModel = this.jsonModel

        if ( !graph ){
            return "Error"
        }

        const process = jsonModel.processes[event.process]
        const uuid = `${process.pid}-${process.name}`;

        
        const edge = graph.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd);
        const filename = graph.target(edge)


        if ( ! edge ){
            return "Error"
        }

        return filename
    }


    getEventDescription(event: any) {

        const process = this.jsonModel.processes[event.process]
        const uuid = `${process.pid}-${process.name}`;

        const filename = this.getRelatedFilename(event)

        return `${uuid} ${getKeyword[event.event_type]} ${filename}`
    }


    getEventInfos(event: any): EventInfos | null {

        const graph = this.completeGraph
        const jsonModel = this.jsonModel

        if ( ! graph ) {
            return null
        }

        const eventInfos = {} as EventInfos

        const process = jsonModel.processes[event.process]
        const uuid = `${process.pid}-${process.name}`
        eventInfos.processUUID = uuid

        switch (event.event_type) {

            case "ExitReadEvent":
            {
                const edge = graph.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened)
                const dataSource = graph.target(edge)
                eventInfos.dataTransfer = true
                eventInfos.dataSource = dataSource
                eventInfos.dataDestination = uuid
                break;
            }
    
            case "WriteEvent":
            {
                const edge = graph.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened)
                const dataDestination = graph.target(edge)
                eventInfos.dataTransfer = true
                eventInfos.dataSource = uuid
                eventInfos.dataDestination = dataDestination
                break;
            }

            default:
                eventInfos.dataTransfer = false

        }

        return eventInfos
    }


    getPossibleConsequences(sourceID: number, events: Array<any>){
        
        const consequences = [sourceID]
        const reachedByEval = new Set()

        if ( ! this.state.currentGraph ) {
            return []
        }

        this.setGraphToEvent(sourceID, events, this.state.currentGraph)

        const eventInfos = this.getEventInfos(events[sourceID])

        if ( ! eventInfos ){
            return []
        }

        reachedByEval.add(eventInfos.processUUID)
        if ( eventInfos.dataTransfer ){
            reachedByEval.add(eventInfos.dataSource)
            reachedByEval.add(eventInfos.dataDestination)
        }

        for( let i=sourceID+1; i<events.length; ++i) {

            const event = events[i]
            
            const eventInfos = this.getEventInfos(event)
            if ( ! eventInfos ) {
                return []
            }
            
            // add event to list
            if ( reachedByEval.has(eventInfos.processUUID) ) {
                consequences.push(i)
            }
            
            // then propagate eval influence
            if ( reachedByEval.has(eventInfos.dataSource) ) {
                reachedByEval.add(eventInfos.dataDestination)
            }
            
            this.applyEventToGraph(event, this.state.currentGraph)
        }

        return consequences
    }


    cleanGraph(graph: DirectedGraph) {

        if ( !graph ){
            return;
        }
    
        for (const edge of graph.edges() ) {
            if( ! graph.getEdgeAttribute(edge, "definitive") ){
                graph.dropEdge(edge);
            }
        }
    }


    setGraphToEvent(eventID: number, graph: DirectedGraph | null = null) {

        if ( !graph ){
            if ( !this.state.currentGraph ){
                return
            }
            graph = this.state.currentGraph
        }

        if ( ! this.ipcInstance) {
            return
        }

        this.cleanGraph(graph);
    
        let highlightCallback = () => {};
    
        let id = 0;
        for (const event of this.ipcInstance.events) {
            highlightCallback = this.applyEventToGraph(event, graph);
            
            if (id == eventID) {
                highlightCallback();
                break;
            }
            id += 1;
        }
    }


    applyEventToGraph(event: Event, graph: DirectedGraph) : () => void {

        let highlightCallback: () => void = () => {};

        const processUUID = event.process.getUUID();
    
        switch (event.event_type) {
            case "OpenEvent":
            {
                const file = jsonModel.files[event.file];
                const file_label = file.path;
                const edge = graph?.addEdge(uuid, file_label, { size: 3, color: "blue", type: 'arrow'});
                graph?.setEdgeAttribute(edge, "fd", event.fd);
                graph?.setEdgeAttribute(edge, "is_opened", true);
                break;
            }
                
    
            case "CloseEvent":
            {
                const edge = graph?.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                graph?.setEdgeAttribute(edge, "color", "lightgrey");
                graph?.setEdgeAttribute(edge, "is_opened", false);
                break;
            }
    
            case "EnterReadEvent":
            {
                const edge = graph?.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                const color = graph?.getEdgeAttribute(edge, "color");
                graph?.setEdgeAttribute(edge, "previousColor", color);
                graph?.setEdgeAttribute(edge, "color", "green");
                break;
            }

            case "ExitReadEvent":
            {
                const edge = graph?.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                const previousColor = graph?.getEdgeAttribute(edge, "previousColor");
                graph?.setEdgeAttribute(edge, "color", previousColor);
                highlightCallback = () => graph?.setEdgeAttribute(edge, "color", "green");
                break;
            }
    
            case "WriteEvent":
            {
                const edge = graph?.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                highlightCallback = () => graph?.setEdgeAttribute(edge, "color", "red");
                break;
            }
            
        }
    
        return highlightCallback
    }


    loadInstance(content: string) {

        const jsonInstance = JSON.parse(content);
        const ipcInstance = IPCInstance.loadInstanceFromJSON(jsonInstance)

        const graph = new DirectedGraph();

    
        for (const file of ipcInstance.files) {
            const fileLabel = file.name;
            graph.addNode(fileLabel, { x: myHash(fileLabel), y: myHash(fileLabel), size: 10, color: "green", label: fileLabel });
        }
    
        for (const process of ipcInstance.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { x: myHash(processLabel), y: myHash(processLabel), size: 10, color: "red", label: processLabel });
        }

        for (const event of ipcInstance.events) {
            if ( (event instanceof EnterReadEvent ||
                event instanceof ExitReadEvent ||
                event instanceof WriteEvent) && event.fd === 1
            ) {
                const processLabel = event.process.getUUID();
                // TODO: fd = 1 is always STDOUT
                const nodeLabel = `${processLabel}-STDOUT`;
                graph.addNode(nodeLabel, { x: myHash(nodeLabel), y: myHash(nodeLabel), size: 10, color: "blue", label: nodeLabel });
                
                const edge = graph.addEdge(processLabel, nodeLabel, { size: 3, color: "black", type: 'arrow'});
                graph.setEdgeAttribute(edge, "definitive", true);
                graph.setEdgeAttribute(edge, "fd", 1);
                graph.setEdgeAttribute(edge, "is_opened", true);            }
        } 

        this.ipcInstance = ipcInstance

        FA2Layout.assign(graph, {iterations: 50});

        this.setState({currentGraph: graph}, () => {
            this.props.onGraphLoaded?.(ipcInstance)
        });

        const completeGraph = graph.copy()
        this.setGraphToEvent(ipcInstance.events.length - 1, completeGraph)
        this.completeGraph = completeGraph

    }


    render() {

        const sigmaRefCallback = (sigmaInstance: Sigma | null) => {
            if ( ! sigmaInstance ) {
                return
            }

            this.sigmaInstance = sigmaInstance
            this.registerGraphEvents()
        }

        let body;
        if (this.state.currentGraph) {
            body = 
            <SigmaContainer ref={sigmaRefCallback} graph={this.state.currentGraph}>
                <ControlsContainer position={'bottom-right'}>
                    <ZoomControl />
                    <FullScreenControl />
                </ControlsContainer>
            </SigmaContainer>
        } else {
            body = <div>Load a model to display its graph view</div>;
        }

        return (
            <div className={`flex items-center justify-center font-mono ${this.props.className}`}>
                {body}
            </div>
        );
    }
}

export default GraphPanel;

