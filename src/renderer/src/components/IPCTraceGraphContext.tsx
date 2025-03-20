
import { IPCTraceGraph } from "@common/IPCTraceGraph";
import { useState, createContext } from "react";

import { Event, IPCTrace } from "@common/types";


interface IPCTraceGraphContextType {
    ipcTraceGraph: [IPCTraceGraph | null, React.Dispatch<React.SetStateAction<IPCTraceGraph | null>>],
    selectedNode: [string | null, (node: string) => void],
    selectedEvent: [Event | null, (event: Event) => void],
    setNodeVisibility: (node: string, visible: boolean) => void,
    loadFile: (filename: string, content: string) => void,
    loadTrace: (ipcTrace: IPCTrace) => void,
    loadTraceGraph: (ipcTraceGraph: IPCTraceGraph) => void,
}


const IPCTraceGraphContext = createContext<IPCTraceGraphContextType>({
    ipcTraceGraph: [null, () => {}], 
    selectedNode: [null, () => {}], 
    selectedEvent: [null, () => {}], 
    setNodeVisibility: () => {},
    loadFile: () => {}, 
    loadTrace: () => {},
    loadTraceGraph: () => {},
});


const IPCTraceGraphProvider = ({ children }) => {
    const [ipcTraceGraph, setIPCTraceGraph] = useState<IPCTraceGraph | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    
    const externalSetSelectedNode = (node: string) => {
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
    }

    const externalSetSelectedEvent = (event: Event) => {

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
    }

    const setNodeVisibility = (node: string, visible: boolean) => {
        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set node visibility")
            return
        }

        ipcTraceGraph.setNodeVisibility(node, visible)
    }

    const loadFile = (filename: string, content: string) => {

        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        loadTrace(ipcTrace)
    }

    const loadTrace = (ipcTrace: IPCTrace) => {
        const newIpcTraceGraph = new IPCTraceGraph(ipcTrace)
        
        const initialEvent = ipcTrace.events[0]
    
        setIPCTraceGraph(newIpcTraceGraph)
        externalSetSelectedEvent(newIpcTraceGraph.selectedEvent)
        newIpcTraceGraph.applyUntilEvent(initialEvent)

        externalSetSelectedNode(newIpcTraceGraph.selectedNode)
        newIpcTraceGraph.clearHighlights()
        newIpcTraceGraph.highlightNode(initialEvent.process.getUUID())
    }

    const loadTraceGraph = (ipcTraceGraph: IPCTraceGraph) => {
        setIPCTraceGraph(ipcTraceGraph)
        setSelectedEvent(ipcTraceGraph.selectedEvent)
        setSelectedNode(ipcTraceGraph.selectedNode)
    }
    
    const value: IPCTraceGraphContextType = {
        ipcTraceGraph: [ipcTraceGraph, setIPCTraceGraph],
        selectedNode: [selectedNode, externalSetSelectedNode],
        selectedEvent: [selectedEvent, externalSetSelectedEvent],
        setNodeVisibility: setNodeVisibility,
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