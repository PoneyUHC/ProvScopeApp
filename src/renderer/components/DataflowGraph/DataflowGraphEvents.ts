
import { useCallback, useContext, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { CameraState, MouseCoords, SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";

import { DataflowGraphContext, DataflowGraphContextType } from "./DataflowGraphProvider";


interface DataflowGraphEventsProps {
    showDataflowFrom: (node: string | null) => void;
}


const DataflowGraphEvents: React.FC<DataflowGraphEventsProps> = ({ showDataflowFrom }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [_downStageCameraState, setDownStageCameraState] = useState<CameraState | null>(null);

    const {
        selectedNodes: [selectedNodes, setSelectedNodes],
    } = useContext<DataflowGraphContextType>(DataflowGraphContext);


    useEffect(() => {
        sigma.getGraph().forEachNode((node) => {
            sigma.getGraph().setNodeAttribute(node, 'highlighted', selectedNodes.includes(node));
        });
    }, [selectedNodes]);

    const addNodeToSelection = (node: string, prevSelectedNodes) => {
        return [...prevSelectedNodes, node];
    }

    const removeNodeFromSelection = (node: string, prevSelectedNodes) => {
        return prevSelectedNodes.filter(n => n !== node);
    }

    const handleMultiSelection = (node: string) => {
        setSelectedNodes(prevSelectedNodes => {
            if (prevSelectedNodes.includes(node)) {
                return removeNodeFromSelection(node, prevSelectedNodes);
            } else {
                return addNodeToSelection(node, prevSelectedNodes);
            }
        });
    }

    const handleSelectSingleNode = (node: string) => {
        setSelectedNodes(prevSelectedNodes => {
            if(!prevSelectedNodes.includes(node)){
                // Clear previous selection if the node is not already selected
                return [node];
            }
            return prevSelectedNodes;
        })
    }

    let gKeyPressed = false;

    document.addEventListener("keydown", (event) => {
        if (event.code === "KeyG") {
            gKeyPressed = true;
        }
    });

    document.addEventListener("keyup", (event) => {
        if (event.code === "KeyG") {
            gKeyPressed = false;
        }
    });

    const isGKeyPressed = (): boolean => {
        return gKeyPressed;
    };


    const onDownNode = (e: SigmaNodeEventPayload) => {

        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;
        const isRightMouseButtonPressed = (e.event.original as MouseEvent).button === 2;
        const isShiftPressed = (e.event.original as MouseEvent).shiftKey;
        const isAltPressed = (e.event.original as MouseEvent).altKey;
        
        const currentNode = e.node;

        // priority to right click
        if (isRightMouseButtonPressed) {
            onRightClickNode(e)
            return;
        }

        if (!isLeftMouseButtonPressed) return;

        if (isShiftPressed) {
            handleMultiSelection(currentNode);
        }

        if (isAltPressed) {
            const selectedNode = sigma.getGraph().getNodeAttribute(e.node, 'objectName');
            const nodeFamily = sigma.getGraph().filterNodes((node) => { 
                return sigma.getGraph().getNodeAttribute(node, 'objectName') === selectedNode 
            });
            setSelectedNodes(nodeFamily);
        }

        if (!isShiftPressed && !isAltPressed) {
            handleSelectSingleNode(currentNode);
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


    const onNodeMouseUp = () => {
        setDraggedNode(null);
    }

    const onStageMouseDown = (_e: SigmaStageEventPayload) => {
        // used to differenciate between a click and a camera move
        const cameraState = sigma.getCamera().getState()
        setDownStageCameraState( cameraState );
    }


    const onStageMouseUp = (e: SigmaStageEventPayload) => {
        
        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;
        if ( ! isLeftMouseButtonPressed ) return;

        // handles too fast movement that results in upstage event
        if ( draggedNode !== null ) {
            setDraggedNode(null);
            return;
        }

        const currentCameraState = sigma.getCamera().getState();
        setDownStageCameraState( prevState => {

            // movement started on node, do nothing
            if ( ! prevState ) {
                return null;
            }

            const hasCameraMoved = currentCameraState.x !== prevState.x || currentCameraState.y !== prevState.y;
            if ( ! hasCameraMoved) {
                setSelectedNodes([]);
                return prevState; 
            }

            return null; 
        });
    }


    const onRightClickStage = (_e: SigmaStageEventPayload) => {
        showDataflowFrom(null);
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
        });
    }, [registerEvents, sigma, draggedNode]);

    return null;
};


export default DataflowGraphEvents;