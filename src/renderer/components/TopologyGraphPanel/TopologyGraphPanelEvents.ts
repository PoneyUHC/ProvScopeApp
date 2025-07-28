
import { useContext, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

import { TopologyGraph } from "@common/TopologyGraph";

import { TopologyGraphContext } from './TopologyGraphContext';


interface GraphEventsProps {
    topologyGraph: TopologyGraph;
}

const GraphEvents: React.FC<GraphEventsProps> = () => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const { 
        topologyGraph : [topologyGraph, _setTopologyGraph], 
    } = useContext(TopologyGraphContext)
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    

    const onDownNode = (e: SigmaNodeEventPayload) => {
        if (topologyGraph) {
            topologyGraph.clearHighlights();
        }
        setDraggedNode(e.node);
        sigma.getGraph().setNodeAttribute(e.node, 'highlighted', true);
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
        if (topologyGraph) {
            topologyGraph.clearHighlights();
        }
    }

    const onMouseDown = () => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }


    useEffect(() => {
        // Register the events
        registerEvents({
            downNode: (e) => onDownNode(e),
            mousemovebody: (e) => onMouseMove(e),
            upNode: () => onNodeMouseUp(),
            upStage: () => onStageMouseUp(),
            mousedown: () => onMouseDown()
        });
    }, [registerEvents, sigma, draggedNode]);

    return null;
};


export default GraphEvents;