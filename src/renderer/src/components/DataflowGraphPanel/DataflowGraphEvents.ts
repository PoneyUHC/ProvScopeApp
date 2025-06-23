
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useCallback, useEffect, useState } from "react";
import { MouseCoords, SigmaNodeEventPayload } from "sigma/types";



interface DataflowGraphEventsProps {
    setSelectedNode: (node: string | null) => void;
    toggleNodeVersionsVisibility: (node: string) => void;
}

const DataflowGraphEvents: React.FC<DataflowGraphEventsProps> = ({ setSelectedNode, toggleNodeVersionsVisibility }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    
    
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
        setSelectedNodes(prevSelectedNodes => {
            if(!prevSelectedNodes.includes(node)){
                
                // Clear previous selection if the node is not already selected
                for(const n of prevSelectedNodes) {
                    sigma.getGraph().setNodeAttribute(n, 'highlighted', false);
                }
                sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
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
        setSelectedNode(e.node);
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

        if (!draggedNode) return;

        for(const node of selectedNodes) {
            sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
            
        }
        
        //we clear the dragged node highlight if it is not in the selected nodes
        if (!selectedNodes.includes(draggedNode)) { 
            sigma.getGraph().setNodeAttribute(draggedNode, 'highlighted', false);
        }

        setDraggedNode(null);
    }

    const onStageMouseUp = () => {
        
        //we clear the selection if we click on the stage
        if(selectedNodes.length > 0) { 
            clearSelection();
        }

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
            mousedown: () => onMouseDown(),
        });
    }, [registerEvents, sigma, draggedNode]);

    return null;
};


export default DataflowGraphEvents;