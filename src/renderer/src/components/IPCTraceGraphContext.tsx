
import { IPCTraceGraph } from "@common/IPCTraceGraph";
import { useState, createContext, useCallback } from "react";

import { Event, IPCTrace } from "@common/types";


interface IPCTraceGraphContextType {
    ipcTraceGraph: [IPCTraceGraph | null, React.Dispatch<React.SetStateAction<IPCTraceGraph | null>>],
    selectedNode: [string | null, (node: string) => void],
    selectedEvent: [Event | null, (event: Event) => void],
    hiddenNodes: [Set<string>, (node: string) => void, (nodes: string) => void],
    hiddenEvents: [Set<Event>, (event: Event) => void, (event: Event) => void],
    loadFile: (filename: string, content: string) => void,
    loadTrace: (ipcTrace: IPCTrace) => void,
    loadTraceGraph: (ipcTraceGraph: IPCTraceGraph) => void,
}


const IPCTraceGraphContext = createContext<IPCTraceGraphContextType>({
    ipcTraceGraph: [null, () => {}], 
    selectedNode: [null, () => {}], 
    selectedEvent: [null, () => {}],
    hiddenNodes: [new Set<string>(), () => {}, () => {}],
    hiddenEvents: [new Set<Event>(), () => {}, () => {}],
    loadFile: () => {}, 
    loadTrace: () => {},
    loadTraceGraph: () => {},
});


const IPCTraceGraphProvider = ({ children }) => {
    const [ipcTraceGraph, setIPCTraceGraph] = useState<IPCTraceGraph | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set<string>())
    const [hiddenEvents, setHiddenEvents] = useState<Set<Event>>(new Set<Event>())
    
    
    const externalSetSelectedNode = useCallback((node: string) => {
        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set selected node")
            return
        }

        // we have a state to trigger a re-render
        setSelectedNode(node)
        // and a redondent field in the graph to save the selected node event when 
        // <IPCTraceGraphProvider> is not mounted
        ipcTraceGraph.selectedNode = node

        ipcTraceGraph.clearHighlights()
        ipcTraceGraph.highlightNode(node)
    }, [ipcTraceGraph])


    const externalSetSelectedEvent = useCallback((event: Event) => {

        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set selected event")
            return
        }

        // same reason as above for duplicity
        setSelectedEvent(event)
        ipcTraceGraph.selectedEvent = event

        ipcTraceGraph.applyUntilEvent(event)
        ipcTraceGraph.clearHighlights()
        ipcTraceGraph.highlightNode(event.process.getUUID())
    }, [ipcTraceGraph])


    const hideNode = useCallback((node: string) => {
        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set hidden nodes")
            return
        }

        setHiddenNodes(new Set([...hiddenNodes, node]))
        ipcTraceGraph.hideNode(node)
    }, [ipcTraceGraph, hiddenNodes])


    const showNode = useCallback((node: string) => {
        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set hidden nodes")
            return
        }

        setHiddenNodes(new Set([...hiddenNodes].filter((n) => n !== node)))
        ipcTraceGraph.showNode(node)
    }, [ipcTraceGraph, hiddenNodes])


    const hideEvent = useCallback((event: Event) => {

        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set hidden events")
            return
        }

        setHiddenEvents(new Set([...hiddenEvents, event]))
        ipcTraceGraph.hideEvent(event)
    }, [ipcTraceGraph, hiddenEvents])


    const showEvent = useCallback((event: Event) => {

        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set hidden events")
            return
        }

        setHiddenEvents(new Set([...hiddenEvents].filter((e) => e !== event)))
        ipcTraceGraph.showEvent(event)
    }, [ipcTraceGraph, hiddenEvents])


    const loadTrace = useCallback((ipcTrace: IPCTrace) => {
        const newIpcTraceGraph = IPCTraceGraph.create(ipcTrace)
        
        const initialEvent = ipcTrace.events[0]
    
        setIPCTraceGraph(newIpcTraceGraph)
        externalSetSelectedEvent(newIpcTraceGraph.selectedEvent)
        newIpcTraceGraph.applyUntilEvent(initialEvent)

        externalSetSelectedNode(newIpcTraceGraph.selectedNode)
        newIpcTraceGraph.clearHighlights()
        newIpcTraceGraph.highlightNode(initialEvent.process.getUUID())

        setHiddenNodes(newIpcTraceGraph.hiddenNodes)
        setHiddenEvents(newIpcTraceGraph.hiddenEvents)
    }, [externalSetSelectedEvent, externalSetSelectedNode])


    const loadFile = useCallback((filename: string, content: string) => {

        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        loadTrace(ipcTrace)
    }, [loadTrace])


    const loadTraceGraph = (ipcTraceGraph: IPCTraceGraph) => {
        setIPCTraceGraph(ipcTraceGraph)
        setSelectedEvent(ipcTraceGraph.selectedEvent)
        setSelectedNode(ipcTraceGraph.selectedNode)
    }

    
    const value: IPCTraceGraphContextType = {
        ipcTraceGraph: [ipcTraceGraph, setIPCTraceGraph],
        selectedNode: [selectedNode, externalSetSelectedNode],
        selectedEvent: [selectedEvent, externalSetSelectedEvent],
        hiddenNodes: [hiddenNodes, hideNode, showNode],
        hiddenEvents: [hiddenEvents, hideEvent, showEvent],
        loadFile: loadFile,
        loadTrace: loadTrace,
        loadTraceGraph: loadTraceGraph,
    }

    return (
        <IPCTraceGraphContext.Provider value={value}>
            {children}
        </IPCTraceGraphContext.Provider>
    );
};

export { IPCTraceGraphContext, IPCTraceGraphProvider };
export type { IPCTraceGraphContextType };