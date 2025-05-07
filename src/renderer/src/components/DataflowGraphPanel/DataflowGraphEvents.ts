
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useEffect, useState } from "react";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

interface DataflowGraphEventsProps {
    setSelectedNode: (node: string | null) => void;
    toggleNodeVersionsVisibility: (node: string) => void;
}

const DataflowGraphEvents: React.FC<DataflowGraphEventsProps> = ({ setSelectedNode, toggleNodeVersionsVisibility }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);


    const onDownNode = (e: SigmaNodeEventPayload) => {

        if ((e.event.original as MouseEvent).button === 2) {
            onRightClickNode(e)
            return;
        }

        if ((e.event.original as MouseEvent).button !== 0) return;

        if ((e.event.original as MouseEvent).ctrlKey) {
            toggleNodeVersionsVisibility(e.node);
            return;
        }

        setDraggedNode(e.node);
        sigma.getGraph().setNodeAttribute(e.node, 'highlighted', true);
    }

    const onRightClickNode = (e: SigmaNodeEventPayload) => {
        setSelectedNode(e.node);
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

        if (!draggedNode) return;

        sigma.getGraph().setNodeAttribute(draggedNode, 'highlighted', false);
        setDraggedNode(null);
    }

    const onStageMouseUp = () => {

        onNodeMouseUp()
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


export default DataflowGraphEvents;