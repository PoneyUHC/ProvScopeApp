
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

import { EnterReadEvent, ExitReadEvent, IPCInstance, WriteEvent, Event, OpenEvent, CloseEvent, FSEvent } from '../types.ts';
import { toUniform } from '../utils.ts';


const eventFilenameLookup: Map<Event, string> = new Map()


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


class GraphPanel extends Component<GraphPanelProps, GraphPanelState> {

    sigmaInstance: Sigma | null = null;
    didRegisterEvents: boolean = false
    draggedNode: string | null = null;

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


    getEventFilename(event: FSEvent, lookupGraph: DirectedGraph): string | null {
        
        const processUUID = event.process.getUUID();

        const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
        
        if ( ! edge ){
            return null
        }

        const filename = lookupGraph.target(edge)
        return filename
    }

    
    precomputeEventFilenames() {

        if ( ! this.ipcInstance || ! this.state.currentGraph ) {
            return
        }

        const tmpGraph = this.state.currentGraph
        this.cleanGraph(tmpGraph)

        for (const event of this.ipcInstance.events) {
            
            const filename1 = this.getEventFilename(event as FSEvent, tmpGraph)
            this.applyEventToGraph(event as FSEvent, tmpGraph)
            const filename2 = this.getEventFilename(event as FSEvent, tmpGraph)
            const filename = filename1 || filename2
            eventFilenameLookup.set(event, filename || "Error")
         
        }
    }


    getEventDescription(event: Event) {

        const processUUID = event.process.getUUID();

        if ( ! (event instanceof FSEvent) ) {
            return "Error: not a FSEvent"
        }

        const filename = eventFilenameLookup.get(event) || "Error"
        return `${processUUID} ${event.getKeyword()} ${filename}`
    }


    getDataTransferInfos(event: Event, lookupGraph: DirectedGraph): EventInfos {

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


    getPossibleConsequences(originEvent: Event): Event[] {
        
        const consequences = [originEvent]
        const nodesReachedByEval = new Set<string>()

        if ( ! this.state.currentGraph  || ! this.ipcInstance ){ 
            return []
        }

        const tmpGraph = this.state.currentGraph
        this.cleanGraph(tmpGraph)

        this.applyUntilEvent(originEvent, tmpGraph)

        const eventInfos = this.getDataTransferInfos(originEvent, tmpGraph)

        if ( ! eventInfos ){
            return []
        }

        nodesReachedByEval.add(eventInfos.processUUID)
        if ( eventInfos.dataTransfer ){
            nodesReachedByEval.add(eventInfos.dataSource)
            nodesReachedByEval.add(eventInfos.dataDestination)
        }

        const startIndex = this.ipcInstance.events.indexOf(originEvent)

        for( const event of this.ipcInstance.events.slice(startIndex+1) ) {
            
            this.applyEventToGraph(event, tmpGraph)
            const eventInfos = this.getDataTransferInfos(event, tmpGraph)
            
            // add event to list
            if ( nodesReachedByEval.has(eventInfos.processUUID) ) {
                consequences.push(event)
            }
            
            // then propagate eval influence
            if ( nodesReachedByEval.has(eventInfos.dataSource) ) {
                nodesReachedByEval.add(eventInfos.dataDestination)
            }
        }

        return consequences
    }


    cleanGraph(graph: DirectedGraph) {

        if ( !graph ){
            return;
        }
    
        for (const edge of graph.edges() ) {
            if( graph.getEdgeAttribute(edge, "definitive") ){
                graph.setEdgeAttribute(edge, "color", "black");
            } else {
                graph.dropEdge(edge);
            }
        }
    }


    applyUntilEvent(targetEvent: Event, graph: DirectedGraph | null = null): boolean {

        if ( ! this.ipcInstance ){
            return false
        }

        if ( !graph ){
            if ( !this.state.currentGraph){
                return false
            }

            graph = this.state.currentGraph
        }

        this.cleanGraph(graph);
    
        let highlightCallback = () => {};
    
        for (const event of this.ipcInstance.events) {
            highlightCallback = this.applyEventToGraph(event as FSEvent, graph);
            
            if (event === targetEvent) {
                highlightCallback();
                break;
            }
        }

        return true
    }


    applyEventToGraph(event: Event, graph: DirectedGraph) : () => void {

        let highlightCallback: () => void = () => {};

        const processUUID = event.process.getUUID();

        if ( ! (event instanceof FSEvent) ) {
            console.error(`Can only apply FSEvent to graph, got ${event}`)
            return () => {}
        }

        if ( event instanceof OpenEvent ){

            const edge = graph.addEdge(processUUID, event.file.name, { size: 3, color: "blue", type: 'arrow'});
            graph.setEdgeAttribute(edge, "fd", event.fd);
            graph.setEdgeAttribute(edge, "isOpened", true);

        } else if ( event instanceof CloseEvent ) {

            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            graph.setEdgeAttribute(edge, "color", "lightgrey");
            graph.setEdgeAttribute(edge, "isOpened", false);

        } else if ( event instanceof EnterReadEvent ) {

            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const color = graph.getEdgeAttribute(edge, "color");
            graph.setEdgeAttribute(edge, "previousColor", color);
            graph.setEdgeAttribute(edge, "color", "green");
        
        } else if ( event instanceof ExitReadEvent ) {
        
            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const previousColor = graph.getEdgeAttribute(edge, "previousColor");
            graph.setEdgeAttribute(edge, "color", previousColor);
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "green");
        
        } else if ( event instanceof WriteEvent ) {

            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "red");

        }
    
        return highlightCallback
    }


    loadInstance(content: string) {

        const jsonInstance = JSON.parse(content);
        const ipcInstance = IPCInstance.loadInstanceFromJSON(jsonInstance)

        const graph = new DirectedGraph();

    
        for (const file of ipcInstance.files) {
            const fileLabel = file.name;
            graph.addNode(fileLabel, { x: toUniform(fileLabel)*10, y: toUniform(fileLabel+'1')*10, size: 10, color: "green", label: fileLabel, group: 'Files' });
        }
    
        for (const process of ipcInstance.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { x: toUniform(processLabel)*10, y: toUniform(processLabel+'1')*10, size: 10, color: "red", label: processLabel, group: 'Processes' });
        }

        for (const event of ipcInstance.events) {
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
                    const edge = graph.addEdge(processLabel, nodeLabel, { size: 3, color: "black", type: 'arrow'});
                    graph.setEdgeAttribute(edge, "definitive", true);
                    graph.setEdgeAttribute(edge, "fd", 1);
                    graph.setEdgeAttribute(edge, "isOpened", true);            
                }
            }   
        } 

        this.ipcInstance = ipcInstance

        FA2Layout.assign(graph, {iterations: 50});

        this.setState({currentGraph: graph}, () => {

            this.precomputeEventFilenames()
            this.props.onGraphLoaded?.(ipcInstance)
        });
    }


    getNodesByGroup(): Map<string, string[]> | null {
        
        if ( ! this.state.currentGraph ){
            return null
        }

        const nodesByGroup = new Map<string, string[]>()

        for (const node of this.state.currentGraph.nodes()) {
            const group = this.state.currentGraph.getNodeAttribute(node, 'group')
            if ( ! nodesByGroup.get(group) ){
                nodesByGroup.set(group, [])
            }
            nodesByGroup.get(group)!.push(node)
        }

        return nodesByGroup
    }


    toggleNodeVisibility(node: string) {

        if ( ! this.state.currentGraph ){
            return
        }

        const currentVisibility = this.state.currentGraph.getNodeAttribute(node, 'hidden')
        this.state.currentGraph?.setNodeAttribute(node, 'hidden', !currentVisibility)
    }


    refresh() {
        this.sigmaInstance?.refresh()
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

