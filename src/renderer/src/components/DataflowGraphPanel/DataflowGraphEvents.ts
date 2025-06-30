
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useCallback, useEffect, useState } from "react";
import { CameraState, MouseCoords, SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";

import { Event } from "@common/types";


interface DataflowGraphEventsProps {
    showDataflowFrom: (node: string | null) => void;
    toggleNodeVersionsVisibility: (node: string) => void;
    setDetailsEvent: React.Dispatch<React.SetStateAction<Event | null>>;
    selectedNodes: string[];
    setSelectedNodes: React.Dispatch<React.SetStateAction<string[]>>;
}

const DataflowGraphEvents: React.FC<DataflowGraphEventsProps> = ({ showDataflowFrom, toggleNodeVersionsVisibility, setDetailsEvent, selectedNodes, setSelectedNodes }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [_downStageCameraState, setDownStageCameraState] = useState<CameraState | null>(null);

    const addNodeToSelection = (node: string, prevSelectedNodes) => {
        sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
        return [...prevSelectedNodes, node];
    }

    const removeNodeFromSelection = (node: string, prevSelectedNodes) => {
        sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
        return prevSelectedNodes.filter(n => n !== node);
    }

    const clearSelection = () => {
        setSelectedNodes([]);
        sigma.getGraph().forEachNode((node) => {
            sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
        });
        setDraggedNode(null);
        setDetailsEvent(null);
    }

    const manageNodeSelection = (node: string) => {
        setSelectedNodes(prevSelectedNodes => {
            if (prevSelectedNodes.includes(node)) {
                return removeNodeFromSelection(node, prevSelectedNodes);
            } else {
                return addNodeToSelection(node, prevSelectedNodes);
            }
        });
    }

    const selectSingleNode = (node: string) => {

        const graph = sigma.getGraph()

        setSelectedNodes(prevSelectedNodes => {
            if(!prevSelectedNodes.includes(node)){
                
                // Clear previous selection if the node is not already selected
                for(const n of prevSelectedNodes) {
                    graph.setNodeAttribute(n, 'highlighted', false);
                }
                graph.setNodeAttribute(node, 'highlighted', true);
                setDetailsEvent(graph.getNodeAttribute(node, 'event'));
                return [node];
            }
            return prevSelectedNodes;
        })
    }


    const onDownNode = (e: SigmaNodeEventPayload) => {

        const isShiftPressed = (e.event.original as MouseEvent).shiftKey;
        const isAltPressed = (e.event.original as MouseEvent).altKey;
        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;
        const currentNode = e.node;

        if (isShiftPressed && isLeftMouseButtonPressed) { // Shift + Left Click
            //we add or delete a node from selectedNodes
            manageNodeSelection(currentNode);
            return; //we don't move the node if shift is pressed
        }

        // case where we click on a node not selected
        selectSingleNode(currentNode);
        
        if (isAltPressed && isLeftMouseButtonPressed) {
            //we search the objectName of the selected node
            const selectedNode = sigma.getGraph().getNodeAttribute(e.node, 'objectName');

            //filter the graph to have a list with only the familly of this node
            const node_familly = sigma.getGraph().filterNodes((node) => { 
                return sigma.getGraph().getNodeAttribute(node, 'objectName') === selectedNode });

            clearSelection();
            setSelectedNodes(node_familly);
        }

        if ((e.event.original as MouseEvent).button === 2) {
            onRightClickNode(e)
            return;
        }

        if ((e.event.original as MouseEvent).button !== 0) return;

        if ((e.event.original as MouseEvent).ctrlKey) {
            toggleNodeVersionsVisibility(e.node);
            return;
        }

        setDraggedNode(currentNode);
    }


    const onRightClickNode = (e: SigmaNodeEventPayload) => {
        showDataflowFrom(e.node);
    }


    const moveSelectedNodes = useCallback((dx: number, dy: number) => {
        const graph = sigma.getGraph();
        for(const node of selectedNodes) {
            graph.setNodeAttribute(node, 'x', graph.getNodeAttribute(node, 'x') + dx);
            graph.setNodeAttribute(node, 'y', graph.getNodeAttribute(node, 'y') + dy);
        }
    }, [selectedNodes, sigma]);


    const onMouseMove = (event: MouseCoords) => {

        if( ! draggedNode ) return;

        const mouseCoords = event
        const pos = sigma.viewportToGraph(mouseCoords)
        const graph = sigma.getGraph()
        const dx = pos.x - graph.getNodeAttribute(draggedNode, 'x');
        const dy = pos.y - graph.getNodeAttribute(draggedNode, 'y');

        moveSelectedNodes(dx, dy);
        
        event.preventSigmaDefault()
        event.original.preventDefault()
        event.original.stopPropagation()
    }


    // Used to handle drag and drop of nodes
    const onNodeMouseUp = () => {

        setDraggedNode(null);

    }

    const onStageMouseDown = (_e: SigmaStageEventPayload) => {
        const cameraState = sigma.getCamera().getState()
        setDownStageCameraState( cameraState );
    }


    const onStageMouseUp = (e: SigmaStageEventPayload) => {
        
        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;

        if ( ! isLeftMouseButtonPressed ) return;

        const currentState = sigma.getCamera().getState();

        setDownStageCameraState( prevState => {

            if ( ! prevState ) {
                return null;
            }

            const isCameraMoved = currentState.x !== prevState.x || currentState.y !== prevState.y;
            if ( ! isCameraMoved ) {
                clearSelection();
                return prevState; 
            }

            return null; 
        });
    }


    const onRightClickStage = (_e: SigmaStageEventPayload) => {
        showDataflowFrom(null);
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
            downStage: (e) => onStageMouseDown(e),
            upStage: (e) => onStageMouseUp(e),
            rightClickStage: (e) => onRightClickStage(e),
            mousedown: () => onMouseDown(),
        });
    }, [registerEvents, sigma, draggedNode]);

    return null;
};


export default DataflowGraphEvents;