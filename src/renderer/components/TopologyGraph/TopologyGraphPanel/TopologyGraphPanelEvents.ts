
import { useContext, useEffect, useRef, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";

import { ExecutionTraceContext, ExecutionTraceContextType } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";

import { TopologyGraphContext, TopologyGraphContextType } from "../TopologyGraphProvider";


const TopologyGraphEvents: React.FC = () => {

    const {
        hiddenObjects: [hiddenObjects, _hideObject, _showObject],
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

    // optimization not to reset attributes on every nodes
    const previousSelectedNodes = useRef<string[]>(selectedNodes);
    const previousHiddenObjects = useRef<string[]>(hiddenObjects);


    useEffect(() => {

        if (!selectedEvent) {
            return;
        }

        topologyGraph.applyUntilEvent(selectedEvent);

    }, [selectedEvent])


    useEffect(() => {

        const graph = topologyGraph.graph;
        for (const node of selectedNodes) {
            if ( !previousSelectedNodes.current.includes(node) ) {
                graph.setNodeAttribute(node, 'highlighted', true);
            }
        }

        for (const node of previousSelectedNodes.current) {
            if ( !selectedNodes.includes(node) ) {
                graph.setNodeAttribute(node, 'highlighted', false);
            }
        }

        previousSelectedNodes.current = selectedNodes;

    }, [selectedNodes])


    useEffect(() => {

        const graph = topologyGraph.graph;
        for (const objectName of hiddenObjects) {
            if ( !previousHiddenObjects.current.includes(objectName) ) {
                const nodes = graph.filterNodes ((n) => graph.getNodeAttribute(n, 'objectName') === objectName);
                for (const node of nodes) {
                    graph.setNodeAttribute(node, 'hidden', true);
                }
            }
        }

        for (const objectName of previousHiddenObjects.current) {
            if ( !hiddenObjects.includes(objectName) ) {
                const nodes = graph.filterNodes ((n) => graph.getNodeAttribute(n, 'objectName') === objectName);
                for (const node of nodes) {
                    graph.setNodeAttribute(node, 'hidden', false);
                }
            }
        }

        previousHiddenObjects.current = hiddenObjects;

    }, [hiddenObjects])


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