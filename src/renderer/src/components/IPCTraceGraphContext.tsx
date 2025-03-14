
import { IPCTraceGraph } from "@common/IPCTraceGraph";
import { useState, createContext } from "react";

import { Event, IPCTrace } from "@common/types";


interface IPCTraceGraphContextType {
    ipcTraceGraph: [IPCTraceGraph | null, React.Dispatch<React.SetStateAction<IPCTraceGraph | null>>],
    selectedNode: [string | null, (node: string) => void],
    selectedEvent: [Event | null, (event: Event) => void],
    setNodeVisibility: (node: string, visible: boolean) => void,
    loadFile: (filename: string, json: string) => void,
    exportTrace: () => void
}


const IPCTraceGraphContext = createContext<IPCTraceGraphContextType>({
    ipcTraceGraph: [null, () => {}], 
    selectedNode: [null, () => {}], 
    selectedEvent: [null, () => {}], 
    setNodeVisibility: () => {},
    loadFile: () => {}, 
    exportTrace: () => {}
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

        setSelectedNode(node)
        ipcTraceGraph.clearHighlights()
        ipcTraceGraph.highlightNode(node)
    }

    const externalSetSelectedEvent = (event: Event) => {

        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to set selected event")
            return
        }

        setSelectedEvent(event)
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
        const newIpcTraceGraph = new IPCTraceGraph(ipcTrace)
        
        console.error("Loaded IPC Trace Graph", newIpcTraceGraph)
        const initialEvent = ipcTrace.events[0]
    
        setIPCTraceGraph(newIpcTraceGraph)
        setSelectedEvent(initialEvent)
        newIpcTraceGraph.applyUntilEvent(initialEvent)

        setSelectedNode(initialEvent.process.getUUID())
        newIpcTraceGraph.clearHighlights()
        newIpcTraceGraph.highlightNode(initialEvent.process.getUUID())
    }

    const exportTrace = () => {
        if ( ! ipcTraceGraph ) {
            console.error("No IPC Trace Graph to export")
            return
        }

        ipcTraceGraph.exportTrace()
    }
    
    const value: IPCTraceGraphContextType = {
        ipcTraceGraph: [ipcTraceGraph, setIPCTraceGraph],
        selectedNode: [selectedNode, externalSetSelectedNode],
        selectedEvent: [selectedEvent, externalSetSelectedEvent],
        setNodeVisibility: setNodeVisibility,
        loadFile: loadFile,
        exportTrace: exportTrace,
    }

    return (
        <IPCTraceGraphContext.Provider value={value}>
            {children}
        </IPCTraceGraphContext.Provider>
    );
};

export { IPCTraceGraphContext, IPCTraceGraphProvider };
export type { IPCTraceGraphContextType };