
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


interface EventInfos {
    processUUID: string;
    dataTransfer: boolean;
    dataSource: string;
    dataDestination: string;
}

interface GraphPanelProps {
    className?: string;
    eventExplorerRef?: RefObject<EventExplorerPanel>
    onGraphLoaded?: (jsonModel: string) => void
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
    jsonModel: any = null;

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

        const edges_to_keep = graph.filterDirectedEdges((_, edgeAttribs) => edgeAttribs.definitive);
    
        for (const edge of graph.edges()! ) {
            if( edges_to_keep.includes(edge) ) {
                graph.setEdgeAttribute(edge, "color", "black");
            } else {
                graph.dropEdge(edge);
            }
        }
    }


    setGraphToEvent(eventID: number, events: Array<any>, graph: DirectedGraph | null = null) {

        if ( !graph ){
            if ( !this.state.currentGraph ){
                return
            }
            graph = this.state.currentGraph
        }
    
        this.cleanGraph(graph);
    
        let highlightCallback = () => {};
    
        let id = 0;
        for (const event of events) {
            highlightCallback = this.applyEventToGraph(event, graph);
            
            if (id == eventID) {
                highlightCallback();
                break;
            }
            id += 1;
        }
    }


    applyEventToGraph(event: any, graph: DirectedGraph) : () => void {

        const jsonModel = this.jsonModel;

        let highlightCallback: () => void = () => {};

        const process = jsonModel.processes[event.process];
        const uuid = `${process.pid}-${process.name}`;
    
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


    loadModel(content: string) {

        const jsonModel = JSON.parse(content);
        const graph = new DirectedGraph();

        for (const file of jsonModel.files) {
            const file_label = file.path;
            graph.addNode(file_label, { x: Math.random(), y: Math.random(), size: 10, color: "green", label: file_label });
        }
    
        for (const process of jsonModel.processes) {
            const process_label = `${process.pid}-${process.name}`;
            graph.addNode(process_label, { x: Math.random(), y: Math.random(), size: 10, color: "red", label: process_label });
    
            for (const open_info of process.open_infos) {
                const file = jsonModel.files[open_info.file];
                const file_label = file.path;
                graph.addEdge(process_label, file_label, { color: "black", type: 'arrow'});
            }
    
            for (const [i, channel] of jsonModel.channels.entries()) {
                const channel_label = channel.name;
        
                if( !graph.hasNode(channel_label) ){
                    graph.addNode(channel_label, { x: Math.random(), y: Math.random(), size: 10, color: "blue", label: channel_label });
                }
    
                for (const comm_info of process.communication_infos) {
                    if (comm_info.channel === i) {
                        if ( !graph.hasEdge(process_label, channel_label) ){
                            const edge = graph.addEdge(process_label, channel_label, { size: 3, color: "black", type: 'arrow'});
                            graph.setEdgeAttribute(edge, "definitive", true);
                            graph.setEdgeAttribute(edge, "fd", 1);
                            graph.setEdgeAttribute(edge, "is_opened", true);
                        }
                    }
                }
            }
        }

        FA2Layout.assign(graph, {iterations: 50});

        this.jsonModel = jsonModel
        this.setState({currentGraph: graph}, () => {
            this.props.onGraphLoaded?.(this.jsonModel)
        });


        const completeGraph = graph.copy()
        this.setGraphToEvent(jsonModel.events.length - 1, jsonModel.events, completeGraph)
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

