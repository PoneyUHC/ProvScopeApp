import { IPCTraceGraph } from "@common/IPCTraceGraph";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useEffect, useState } from "react";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";


interface GraphEventsProps {
    ipcTraceGraph: IPCTraceGraph;
}

const GraphEvents: React.FC<GraphEventsProps> = ({ ipcTraceGraph }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);


    const onDownNode = (e: SigmaNodeEventPayload) => {
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
        ipcTraceGraph.clearHighlights()
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