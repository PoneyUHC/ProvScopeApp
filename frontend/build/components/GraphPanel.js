import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import '@react-sigma/core/lib/style.css';
import { DirectedGraph } from 'graphology';
import FA2Layout from "graphology-layout-forceatlas2";
import { SigmaContainer, ControlsContainer, FullScreenControl, ZoomControl, } from '@react-sigma/core';
import { EnterReadEvent, ExitReadEvent, IPCInstance, WriteEvent, OpenEvent, CloseEvent, FSEvent } from '../types.ts';
import { toUniform } from '../utils.ts';
const eventFilenameLookup = new Map();
class GraphPanel extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "sigmaInstance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "didRegisterEvents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "draggedNode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "ipcInstance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "eventFilenameCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.state = {
            currentGraph: null
        };
    }
    onDownNode(event) {
        const node = event.node;
        this.draggedNode = node;
        this.state.currentGraph?.setNodeAttribute(node, 'highlighted', true);
        this.props.overviewPanelRef?.current?.selectNode(node);
        if (!this.sigmaInstance || !this.draggedNode) {
            return;
        }
        if (!this.sigmaInstance.getCustomBBox()) {
            this.sigmaInstance.setCustomBBox(this.sigmaInstance.getBBox());
        }
    }
    onMouseMove(event) {
        if (!this.sigmaInstance || !this.draggedNode) {
            return;
        }
        const mouseCoords = event.event;
        const pos = this.sigmaInstance.viewportToGraph(mouseCoords);
        this.state.currentGraph?.setNodeAttribute(this.draggedNode, 'x', pos.x);
        this.state.currentGraph?.setNodeAttribute(this.draggedNode, 'y', pos.y);
        event.preventSigmaDefault();
        event.event.original.preventDefault();
        event.event.original.stopPropagation();
    }
    onNodeMouseUp() {
        this.draggedNode = null;
    }
    onStageMouseUp() {
        this.draggedNode = null;
        this.clearHighlights();
    }
    removeProcess(processUUID, ipcInstance) {
        ipcInstance.processes = ipcInstance.processes.filter(p => p.getUUID() !== processUUID);
        ipcInstance.events = ipcInstance.events.filter(e => e.process.getUUID() !== processUUID);
    }
    removeFile(path, ipcInstance) {
        ipcInstance.files = ipcInstance.files.filter(f => f.path !== path);
        ipcInstance.events = ipcInstance.events.filter(e => eventFilenameLookup.get(e) !== path);
    }
    exportInstance() {
        if (!this.ipcInstance || !this.state.currentGraph) {
            return;
        }
        const outIpcInstance = this.ipcInstance.clone();
        const graph = this.state.currentGraph;
        const excludeNodes = graph.nodes().filter(n => graph.getNodeAttribute(n, 'hidden'));
        for (const node of excludeNodes) {
            const group = graph.getNodeAttribute(node, 'group');
            if (group === 'Processes') {
                this.removeProcess(node, outIpcInstance);
            }
            else if (group === 'Files') {
                this.removeFile(node, outIpcInstance);
            }
            else if (group === 'Channels') {
                this.removeFile(node, outIpcInstance);
            }
        }
        IPCInstance.exportToJSON(outIpcInstance);
    }
    registerGraphEvents() {
        if (!this.sigmaInstance) {
            return;
        }
        this.sigmaInstance.on('downNode', (e) => this.onDownNode(e));
        this.sigmaInstance.on('moveBody', (e) => this.onMouseMove(e));
        this.sigmaInstance.on('upNode', () => this.onNodeMouseUp());
        this.sigmaInstance.on('upStage', () => this.onStageMouseUp());
    }
    getEventFilename(event, lookupGraph) {
        const processUUID = event.process.getUUID();
        const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
        if (!edge) {
            return null;
        }
        const filename = lookupGraph.target(edge);
        return filename;
    }
    precomputeEventFilenames() {
        if (!this.ipcInstance || !this.state.currentGraph) {
            return;
        }
        const tmpGraph = this.state.currentGraph;
        this.cleanGraph(tmpGraph);
        for (const event of this.ipcInstance.events) {
            const filename1 = this.getEventFilename(event, tmpGraph);
            this.applyEventToGraph(event, tmpGraph);
            const filename2 = this.getEventFilename(event, tmpGraph);
            const filename = filename1 || filename2;
            eventFilenameLookup.set(event, filename || "Error");
        }
    }
    getEventDescription(event) {
        const processUUID = event.process.getUUID();
        if (!(event instanceof FSEvent)) {
            return "Error: not a FSEvent";
        }
        const filename = eventFilenameLookup.get(event) || "Error";
        return `${processUUID} ${event.getKeyword()} ${filename}`;
    }
    getDataTransferInfos(event, lookupGraph) {
        const eventInfos = {};
        eventInfos.processUUID = event.process.getUUID();
        if (event instanceof ExitReadEvent) {
            const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === eventInfos.processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const dataSource = lookupGraph.target(edge);
            eventInfos.dataTransfer = true;
            eventInfos.dataSource = dataSource;
            eventInfos.dataDestination = eventInfos.processUUID;
        }
        else if (event instanceof WriteEvent) {
            const edge = lookupGraph.findEdge((_, edgeAttribs, source) => source === eventInfos.processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const dataDestination = lookupGraph.target(edge);
            eventInfos.dataTransfer = true;
            eventInfos.dataSource = eventInfos.processUUID;
            eventInfos.dataDestination = dataDestination;
        }
        else {
            eventInfos.dataTransfer = false;
        }
        return eventInfos;
    }
    getPossibleConsequences(originEvent) {
        const consequences = [originEvent];
        const nodesReachedByEval = new Set();
        if (!this.state.currentGraph || !this.ipcInstance) {
            return [];
        }
        const tmpGraph = this.state.currentGraph;
        this.cleanGraph(tmpGraph);
        this.applyUntilEvent(originEvent, tmpGraph);
        const eventInfos = this.getDataTransferInfos(originEvent, tmpGraph);
        if (!eventInfos) {
            return [];
        }
        nodesReachedByEval.add(eventInfos.processUUID);
        if (eventInfos.dataTransfer) {
            nodesReachedByEval.add(eventInfos.dataSource);
            nodesReachedByEval.add(eventInfos.dataDestination);
        }
        const startIndex = this.ipcInstance.events.indexOf(originEvent);
        for (const event of this.ipcInstance.events.slice(startIndex + 1)) {
            this.applyEventToGraph(event, tmpGraph);
            const eventInfos = this.getDataTransferInfos(event, tmpGraph);
            // add event to list
            if (nodesReachedByEval.has(eventInfos.processUUID)) {
                consequences.push(event);
            }
            // then propagate eval influence
            if (nodesReachedByEval.has(eventInfos.dataSource)) {
                nodesReachedByEval.add(eventInfos.dataDestination);
            }
        }
        return consequences;
    }
    cleanGraph(graph) {
        if (!graph) {
            return;
        }
        for (const edge of graph.edges()) {
            if (graph.getEdgeAttribute(edge, "definitive")) {
                graph.setEdgeAttribute(edge, "color", "black");
                graph.setEdgeAttribute(edge, "label", "");
            }
            else {
                graph.dropEdge(edge);
            }
        }
    }
    applyUntilEvent(targetEvent, graph = null) {
        if (!this.ipcInstance) {
            return false;
        }
        if (!graph) {
            if (!this.state.currentGraph) {
                return false;
            }
            graph = this.state.currentGraph;
        }
        this.cleanGraph(graph);
        let highlightCallback = () => { };
        for (const event of this.ipcInstance.events) {
            highlightCallback = this.applyEventToGraph(event, graph);
            if (event === targetEvent) {
                highlightCallback();
                break;
            }
        }
        return true;
    }
    applyEventToGraph(event, graph) {
        if (!this.ipcInstance) {
            return () => { };
        }
        let highlightCallback = () => { };
        const processUUID = event.process.getUUID();
        const eventIndex = this.ipcInstance?.events.indexOf(event);
        if (!(event instanceof FSEvent)) {
            console.error(`Can only apply FSEvent to graph, got ${event}`);
            return () => { };
        }
        if (event instanceof OpenEvent) {
            const edge = graph.addEdge(processUUID, event.file.path, { size: 3, color: "blue", type: 'arrow', label: eventIndex.toString(), forceLabel: true });
            graph.setEdgeAttribute(edge, "fd", event.fd);
            graph.setEdgeAttribute(edge, "isOpened", true);
        }
        else if (event instanceof CloseEvent) {
            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            graph.setEdgeAttribute(edge, "color", "lightgrey");
            graph.setEdgeAttribute(edge, "isOpened", false);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
        }
        else if (event instanceof EnterReadEvent) {
            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const color = graph.getEdgeAttribute(edge, "color");
            graph.setEdgeAttribute(edge, "previousColor", color);
            graph.setEdgeAttribute(edge, "color", "green");
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
        }
        else if (event instanceof ExitReadEvent) {
            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            const previousColor = graph.getEdgeAttribute(edge, "previousColor");
            graph.setEdgeAttribute(edge, "color", previousColor);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "green");
        }
        else if (event instanceof WriteEvent) {
            const edge = graph.findEdge((_, edgeAttribs, source) => source === processUUID && edgeAttribs.fd === event.fd && edgeAttribs.isOpened);
            graph.setEdgeAttribute(edge, "label", eventIndex.toString());
            highlightCallback = () => graph.setEdgeAttribute(edge, "color", "red");
        }
        return highlightCallback;
    }
    loadInstance(name, content) {
        const jsonInstance = JSON.parse(content);
        const ipcInstance = IPCInstance.loadInstanceFromJSON(name, jsonInstance);
        const graph = new DirectedGraph();
        for (const file of ipcInstance.files) {
            const fileLabel = file.path;
            graph.addNode(fileLabel, { x: toUniform(fileLabel) * 10, y: toUniform(fileLabel + '1') * 10, size: 10, color: "green", label: fileLabel, group: 'Files' });
        }
        for (const process of ipcInstance.processes) {
            const processLabel = process.getUUID();
            graph.addNode(processLabel, { x: toUniform(processLabel) * 10, y: toUniform(processLabel + '1') * 10, size: 10, color: "red", label: processLabel, group: 'Processes' });
        }
        for (const event of ipcInstance.events) {
            if ((event instanceof EnterReadEvent ||
                event instanceof ExitReadEvent ||
                event instanceof WriteEvent) && event.fd === 1) {
                const processLabel = event.process.getUUID();
                // TODO: fd = 1 is always STDOUT
                const nodeLabel = `${processLabel}-STDOUT`;
                if (!graph.hasNode(nodeLabel)) {
                    graph.addNode(nodeLabel, { x: toUniform(nodeLabel) * 10, y: toUniform(nodeLabel + '1') * 10, size: 10, color: "blue", label: nodeLabel, group: 'Channels' });
                }
                if (!graph.hasEdge(processLabel, nodeLabel)) {
                    const edge = graph.addEdge(processLabel, nodeLabel, { size: 3, color: "black", type: 'arrow', label: '', forceLabel: true });
                    graph.setEdgeAttribute(edge, "definitive", true);
                    graph.setEdgeAttribute(edge, "fd", 1);
                    graph.setEdgeAttribute(edge, "isOpened", true);
                }
            }
        }
        this.ipcInstance = ipcInstance;
        FA2Layout.assign(graph, { iterations: 50 });
        this.setState({ currentGraph: graph }, () => {
            this.precomputeEventFilenames();
            this.props.onGraphLoaded?.(ipcInstance);
        });
    }
    getNodesByGroup() {
        if (!this.state.currentGraph) {
            return null;
        }
        const nodesByGroup = new Map();
        for (const node of this.state.currentGraph.nodes()) {
            const group = this.state.currentGraph.getNodeAttribute(node, 'group');
            if (!nodesByGroup.get(group)) {
                nodesByGroup.set(group, []);
            }
            nodesByGroup.get(group).push(node);
        }
        return nodesByGroup;
    }
    toggleNodeVisibility(node) {
        if (!this.state.currentGraph) {
            return;
        }
        const currentVisibility = this.state.currentGraph.getNodeAttribute(node, 'hidden');
        this.state.currentGraph?.setNodeAttribute(node, 'hidden', !currentVisibility);
    }
    refresh() {
        this.sigmaInstance?.refresh();
    }
    clearHighlights() {
        if (!this.state.currentGraph) {
            return;
        }
        for (const n of this.state.currentGraph.nodes()) {
            this.state.currentGraph.setNodeAttribute(n, 'highlighted', false);
        }
    }
    highlightNode(node) {
        if (!this.state.currentGraph) {
            return;
        }
        this.clearHighlights();
        this.state.currentGraph.setNodeAttribute(node, 'highlighted', true);
        this.props.overviewPanelRef?.current?.selectNode(node);
        this.refresh();
    }
    render() {
        const sigmaRefCallback = (sigmaInstance) => {
            if (!sigmaInstance) {
                return;
            }
            this.sigmaInstance = sigmaInstance;
            this.registerGraphEvents();
        };
        let body;
        if (this.state.currentGraph) {
            body =
                _jsx(SigmaContainer, { ref: sigmaRefCallback, graph: this.state.currentGraph, settings: { renderEdgeLabels: true }, children: _jsxs(ControlsContainer, { position: 'bottom-right', children: [_jsx(ZoomControl, {}), _jsx(FullScreenControl, {})] }) });
        }
        else {
            body = _jsx("div", { children: "Load a model to display its graph view" });
        }
        return (_jsx("div", { className: `flex items-center justify-center font-mono ${this.props.className}`, children: body }));
    }
}
export default GraphPanel;
