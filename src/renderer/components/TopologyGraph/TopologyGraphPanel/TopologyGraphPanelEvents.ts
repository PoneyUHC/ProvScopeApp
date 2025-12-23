
import { useContext, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

import { ExecutionTraceContext, ExecutionTraceContextType } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";

import { TopologyGraphContext, TopologyGraphContextType } from "../TopologyGraphProvider";


const TopologyGraphEvents: React.FC = () => {

    const {
        hiddenEntities: [hiddenEntities, _hideObject, _showObject],
        hiddenEvents: [hiddenEvents, _hideEvent, _showEvent],
        selectedEvent: [selectedEvent, _setSelectedEvent],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const {
        topologyGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return null;
    }

    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);


    useEffect(() => {

        if (!selectedEvent) {
            return;
        }

        topologyGraph.applyUntilEvent(selectedEvent);

    }, [selectedEvent])


    useEffect(() => {

        const graph = topologyGraph.graph;
        graph.forEachNode((node) => {
            const selected = selectedNodes.includes(node)
            graph.setNodeAttribute(node, 'highlighted', selected)
        })

    }, [selectedNodes])


    useEffect(() => {
        
        const graph = topologyGraph.graph;
        graph.forEachNode((node) => {
            const entity = graph.getNodeAttribute(node, 'entity')
            const hidden = hiddenEntities.includes(entity)
            graph.setNodeAttribute(node, 'hidden', hidden)
        })
        
    }, [hiddenEntities])
    
    
    // TODO: when showing a new event via EventsPanel, hidden edges become visible
    // maybe add a 'graphChanged' callback to topologyGraph, and connect a sigma.refresh() on it.
    useEffect(() => {

        const graph = topologyGraph.graph;
        graph.forEachEdge((edge) => {
            const event = graph.getEdgeAttribute(edge, 'event')
            const hidden = hiddenEvents.includes(event)
            graph.setEdgeAttribute(edge, 'hidden', hidden)
        })

    }, [hiddenEvents])


    const onDownNode = (e: SigmaNodeEventPayload) => {

        setSelectedNodes([e.node]);
        setDraggedNode(e.node);
    }

    const onMouseMove = (event: MouseCoords) => {

        if( ! draggedNode ) return;

        const mouseCoords = event
        const pos = sigma.viewportToGraph(mouseCoords)
        const graph = sigma.getGraph()
        graph.setNodeAttribute(draggedNode, 'x', pos.x)
        graph.setNodeAttribute(draggedNode, 'y', pos.y)
        
        event.preventSigmaDefault()
        event.original.preventDefault()
        event.original.stopPropagation()
    }

    const onNodeMouseUp = () => {
        setDraggedNode(null);
    }

    const onStageMouseUp = () => {
        setDraggedNode(null);
        setSelectedNodes([]);
    }


    useEffect(() => {
        registerEvents({
            downNode: (e) => onDownNode(e),
            mousemovebody: (e) => onMouseMove(e),
            upNode: () => onNodeMouseUp(),
            upStage: () => onStageMouseUp(),
        });
    }, [registerEvents, sigma, draggedNode]);


    return null;
};


export default TopologyGraphEvents;