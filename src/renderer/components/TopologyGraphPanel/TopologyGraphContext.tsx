
import { useState, createContext, useCallback } from "react";

import { TopologyGraph } from "@common/TopologyGraph";
import { Event, ExecutionTrace } from "@common/types";



interface TopologyGraphContextType {
    topologyGraph: [TopologyGraph | null, React.Dispatch<React.SetStateAction<TopologyGraph | null>>],
    selectedNode: [string | null, (node: string) => void],
    selectedEvent: [Event | null, (event: Event) => void],
    hiddenNodes: [Set<string>, (node: string) => void, (nodes: string) => void],
    hiddenEvents: [Set<Event>, (event: Event) => void, (event: Event) => void],
    loadFile: (filename: string, content: string) => void,
    loadTrace: (trace: ExecutionTrace) => void,
    loadTraceGraph: (topologyGraph: TopologyGraph) => void,
}


const TopologyGraphContext = createContext<TopologyGraphContextType>({
    topologyGraph: [null, () => {}], 
    selectedNode: [null, () => {}], 
    selectedEvent: [null, () => {}],
    hiddenNodes: [new Set<string>(), () => {}, () => {}],
    hiddenEvents: [new Set<Event>(), () => {}, () => {}],
    loadFile: () => {}, 
    loadTrace: () => {},
    loadTraceGraph: () => {},
});


const TopologyGraphProvider = ({ children }) => {
    const [topologyGraph, setTopologyGraph] = useState<TopologyGraph | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set<string>())
    const [hiddenEvents, setHiddenEvents] = useState<Set<Event>>(new Set<Event>())
    
    
    const externalSetSelectedNode = useCallback((node: string) => {
        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set selected node")
            return
        }

        // we have a state to trigger a re-render
        setSelectedNode(node)
        // and a redondent field in the graph to save the selected node event when 
        // <TopologyGraphProvider> is not mounted
        topologyGraph.selectedNode = node

        topologyGraph.clearHighlights()
        topologyGraph.highlightNode(node)
    }, [topologyGraph])


    const externalSetSelectedEvent = useCallback((event: Event) => {

        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set selected event")
            return
        }

        // same reason as above for duplicity
        setSelectedEvent(event)
        topologyGraph.selectedEvent = event

        topologyGraph.applyUntilEvent(event)
        topologyGraph.clearHighlights()
        topologyGraph.highlightNode(event.process.getUUID())
    }, [topologyGraph])


    const hideNode = useCallback((node: string) => {
        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set hidden nodes")
            return
        }

        setHiddenNodes(new Set([...hiddenNodes, node]))
        topologyGraph.hideNode(node)
    }, [topologyGraph, hiddenNodes])


    const showNode = useCallback((node: string) => {
        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set hidden nodes")
            return
        }

        setHiddenNodes(new Set([...hiddenNodes].filter((n) => n !== node)))
        topologyGraph.showNode(node)
    }, [topologyGraph, hiddenNodes])


    const hideEvent = useCallback((event: Event) => {

        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set hidden events")
            return
        }

        setHiddenEvents(new Set([...hiddenEvents, event]))
        topologyGraph.hideEvent(event)
    }, [topologyGraph, hiddenEvents])


    const showEvent = useCallback((event: Event) => {

        if ( ! topologyGraph ) {
            console.error("No IPC Trace Graph to set hidden events")
            return
        }

        setHiddenEvents(new Set([...hiddenEvents].filter((e) => e !== event)))
        topologyGraph.showEvent(event)
    }, [topologyGraph, hiddenEvents])


    const loadTrace = useCallback((trace: ExecutionTrace) => {
        const newTopologyGraph = TopologyGraph.create(trace)

        const initialEvent = trace.events[0]

        setTopologyGraph(newTopologyGraph)
        externalSetSelectedEvent(newTopologyGraph.selectedEvent)
        newTopologyGraph.applyUntilEvent(initialEvent)

        externalSetSelectedNode(newTopologyGraph.selectedNode)
        newTopologyGraph.clearHighlights()
        newTopologyGraph.highlightNode(initialEvent.process.getUUID())

        setHiddenNodes(newTopologyGraph.hiddenNodes)
        setHiddenEvents(newTopologyGraph.hiddenEvents)
    }, [externalSetSelectedEvent, externalSetSelectedNode])


    const loadFile = useCallback((filename: string, content: string) => {

        const json = JSON.parse(content)
        const trace = ExecutionTrace.createInstanceFromJSON(filename, json)
        loadTrace(trace)
    }, [loadTrace])


    const loadTraceGraph = (topologyGraph: TopologyGraph) => {
        setTopologyGraph(topologyGraph)
        setSelectedEvent(topologyGraph.selectedEvent)
        setSelectedNode(topologyGraph.selectedNode)
    }

    
    const value: TopologyGraphContextType = {
        topologyGraph: [topologyGraph, setTopologyGraph],
        selectedNode: [selectedNode, externalSetSelectedNode],
        selectedEvent: [selectedEvent, externalSetSelectedEvent],
        hiddenNodes: [hiddenNodes, hideNode, showNode],
        hiddenEvents: [hiddenEvents, hideEvent, showEvent],
        loadFile: loadFile,
        loadTrace: loadTrace,
        loadTraceGraph: loadTraceGraph,
    }

    return (
        <TopologyGraphContext.Provider value={value}>
            {children}
        </TopologyGraphContext.Provider>
    );
};

export { TopologyGraphContext , TopologyGraphProvider };
export type { TopologyGraphContextType };