
import { useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

import { TopologyGraph } from "@common/TopologyGraph";


interface GraphEventsProps {
    topologyGraph: TopologyGraph;
}


const GraphEvents: React.FC<GraphEventsProps> = ({ topologyGraph }) => {

    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    

    const onDownNode = (e: SigmaNodeEventPayload) => {

        topologyGraph.clearHighlights();

        setDraggedNode(e.node);
        topologyGraph.highlightNode(e.node);
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
        topologyGraph.clearHighlights();
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


export default GraphEvents;