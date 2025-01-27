
import { Component, createRef, RefObject } from 'react';

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
import { MouseCoords, SigmaEventPayload, SigmaEvents, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types';


interface GraphPanelProps {
    className?: string;
    eventExplorerRef?: RefObject<EventExplorerPanel>
    onGraphLoaded?: (jsonModel: string) => void
}

interface GraphPanelState {
    graph: DirectedGraph | null;
    jsonModel: any;
}

class GraphPanel extends Component<GraphPanelProps, GraphPanelState> {

    sigmaInstance: Sigma | null = null;
    didRegisterEvents: boolean = false
    draggedNode: string | null = null;

    constructor(props: GraphPanelProps) {
        super(props);
        this.state = {
            graph: null,
            jsonModel: null,
        }
    }


    onDownNode(event: SigmaNodeEventPayload) {

        const node = event.node

        this.draggedNode = node
        this.state.graph?.setNodeAttribute(node, 'highlighted', true)

        if( ! this.sigmaInstance || ! this.draggedNode ){
            return
        }

        if (!this.sigmaInstance.getCustomBBox()){
            this.sigmaInstance.setCustomBBox(this.sigmaInstance.getBBox());
        }
    }


    onMouseMove(event: SigmaEventPayload){

        const {graph} = this.state

        if( ! this.sigmaInstance || ! this.draggedNode ){
            return
        }

        const mouseCoords = event.event 
        const pos = this.sigmaInstance.viewportToGraph(mouseCoords)
        graph?.setNodeAttribute(this.draggedNode, 'x', pos.x)
        graph?.setNodeAttribute(this.draggedNode, 'y', pos.y)
        
        event.preventSigmaDefault()
        event.event.original.preventDefault()
        event.event.original.stopPropagation()
    }


    onMouseUp() {
        
        const { graph } = this.state

        if ( this.draggedNode  ) {
            graph?.removeNodeAttribute(this.draggedNode , 'highlighted')
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


    getSourceTarget(event: any) {

        let jsonModel = this.state.jsonModel
        let process
        let uuid: string

        let graph = this.state.graph

        if ( ! graph ) {
            return [,]
        }

        switch (event.event_type) {
            case "OpenEvent":
                process = jsonModel.processes[event.process]
                uuid = `${process.pid}-${process.name}`
                let filepath = jsonModel.files[event.file].path
                return [uuid, filepath]

            case "CloseEvent":
                // TODO
                break;
    
            case "ReadEvent":
                process = jsonModel.processes[event.process]
                uuid = `${process.pid}-${process.name}`;
                var edge = graph.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                var source = graph.target(edge)
                return [source, uuid]
    
            case "WriteEvent":
                process = jsonModel.processes[event.process]
                uuid = `${process.pid}-${process.name}`;
                var edge = graph.findEdge((_, edgeAttribs, source) => source === uuid && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                var target = graph.target(edge)
                return [uuid, target]
        }

        return [,]
    }


    getPossibleConsequences(sourceID: number, events: Array<any>){
        
        let result = [sourceID]

        let marked = new Set()

        this.setGraphToEvent(sourceID, events)

        const [source, target] = this.getSourceTarget(events[sourceID])
        marked.add(source)

        for( let i=sourceID+1; i<events.length; ++i) {

            let event = events[i]

            const [source, target] = this.getSourceTarget(event)
            if ( marked.has(source) ){
                marked.add(target)
                result.push(i)
            }
            
            this.applyEventToGraph(event)
        }

        return result
    }


    cleanGraph() {
        const graph = this.state.graph
        var edges_to_keep = graph?.filterDirectedEdges((_, edgeAttribs) => edgeAttribs.definitive);
    
        for (const edge of graph?.edges()! ) {
            if( edges_to_keep?.includes(edge) ) {
                graph?.setEdgeAttribute(edge, "color", "black");
            } else {
                graph?.dropEdge(edge);
            }
        }
    }


    setGraphToEvent(eventID: number, events: Array<any>) {
    
        this.cleanGraph();
    
        var highlightCallback = () => {};
    
        var id = 0;
        for (const event of events) {
            highlightCallback = this.applyEventToGraph(event);
            
            if (id == eventID) {
                highlightCallback();
                break;
            }
            id += 1;
        }
    }


    applyEventToGraph(event: any) : () => void {

        var graph = this.state.graph;
        var jsonModel = this.state.jsonModel

        var highlightCallback: () => void = () => {};
    
        switch (event.event_type) {
            case "OpenEvent":
                var process = jsonModel.processes[event.process];
                var file = jsonModel.files[event.file];
                var process_label = `${process.pid}-${process.name}`;
                var file_label = file.path;
                var edge = graph?.addEdge(process_label, file_label, { size: 3, color: "blue", type: 'arrow'});
                console.log('here')
                graph?.setEdgeAttribute(edge, "fd", event.fd);
                graph?.setEdgeAttribute(edge, "is_opened", true);
                break;
    
            case "CloseEvent":
                var process = jsonModel.processes[event.process];
                var process_label = `${process.pid}-${process.name}`;
                var edge = graph?.findEdge((_, edgeAttribs, source) => source === process_label && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                graph?.setEdgeAttribute(edge, "color", "lightgrey");
                graph?.setEdgeAttribute(edge, "is_opened", false);
                break;
    
            case "ReadEvent":
                var process = jsonModel.processes[event.process];
                var process_label = `${process.pid}-${process.name}`;
                var edge = graph?.findEdge((_, edgeAttribs, source) => source === process_label && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                highlightCallback = () => graph?.setEdgeAttribute(edge, "color", "green");
                break;
    
            case "WriteEvent":
                var process = jsonModel.processes[event.process];
                var process_label = `${process.pid}-${process.name}`;
                var edge = graph?.findEdge((_, edgeAttribs, source) => source === process_label && edgeAttribs.fd === event.fd && edgeAttribs.is_opened);
                highlightCallback = () => graph?.setEdgeAttribute(edge, "color", "red");
                break;
            
        }
    
        return highlightCallback
    }


    loadModel(content: string) {

        const jsonModel = JSON.parse(content);
        const graph = new DirectedGraph();

        for (const file of jsonModel.files) {
            var file_label = file.path;
            graph.addNode(file_label, { x: Math.random(), y: Math.random(), size: 10, color: "green", label: file_label });
        }
    
        for (const process of jsonModel.processes) {
            var process_label = `${process.pid}-${process.name}`;
            graph.addNode(process_label, { x: Math.random(), y: Math.random(), size: 10, color: "red", label: process_label });
    
            for (const open_info of process.open_infos) {
                const file = jsonModel.files[open_info.file];
                var file_label = file.path;
                graph.addEdge(process_label, file_label, { color: "black", type: 'arrow'});
            }
    
            for (const [i, channel] of jsonModel.channels.entries()) {
                var channel_label = channel.name;
        
                if( !graph.hasNode(channel_label) ){
                    graph.addNode(channel_label, { x: Math.random(), y: Math.random(), size: 10, color: "blue", label: channel_label });
                }
    
                for (const comm_info of process.communication_infos) {
                    if (comm_info.channel === i) {
                        if ( !graph.hasEdge(process_label, channel_label) ){
                            var edge = graph.addEdge(process_label, channel_label, { size: 3, color: "black", type: 'arrow'});
                            graph.setEdgeAttribute(edge, "definitive", true);
                            graph.setEdgeAttribute(edge, "fd", 1);
                            graph.setEdgeAttribute(edge, "is_opened", true);
                        }
                    }
                }
            }
        }

        FA2Layout.assign(graph, {iterations: 50});

        this.setState({graph, jsonModel}, () => {
            this.props.onGraphLoaded?.(this.state.jsonModel)
        });
    }


    render() {

        const { graph } = this.state;

        const sigmaRefCallback = (sigmaInstance: Sigma | null) => {
            if ( ! sigmaInstance ) {
                return
            }

            this.sigmaInstance = sigmaInstance
            this.registerGraphEvents()
        }

        let body;
        if (graph) {
            body = 
            <SigmaContainer ref={sigmaRefCallback} graph={graph}>
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

