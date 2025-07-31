
import { useContext, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

import { TopologyGraph } from "@common/TopologyGraph";
import { ExecutionTraceContext, ExecutionTraceContextType } from "@renderer/components/TraceBrowserTool/ExecutionTraceContext";


interface GraphEventsProps {
    topologyGraph: TopologyGraph;
}


const GraphEvents: React.FC<GraphEventsProps> = ({ topologyGraph }) => {

    const {
        selectedObjects: [selectedObjects, setSelectedObjects],
        hiddenObjects: [hiddenObjects, _hideObject, _showObject],
        selectedEvent: [selectedEvent, _setSelectedEvent],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

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

        topologyGraph.clearHighlights();
        
        topologyGraph.highlightNodes(selectedObjects);

    }, [selectedObjects])


    useEffect(() => {

        topologyGraph.hideObjects(hiddenObjects);

    }, [hiddenObjects])


    const onDownNode = (e: SigmaNodeEventPayload) => {

        const objectName = topologyGraph.getGraph().getNodeAttribute(e.node, 'objectName');

        setSelectedObjects([objectName]);
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