
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { CameraState, MouseCoords, SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";

import { Entity, Event } from "@common/types";
import { ProvenanceEngine } from "@common/Provenance/ProvenanceEngine";

import { ProvenanceGraphContext, ProvenanceGraphContextType } from "./ProvenanceGraphProvider";
import { ExecutionTraceContext, ExecutionTraceContextType } from "../TraceBrowserTool/ExecutionTraceProvider";



const ProvenanceGraphEvents: React.FC = () => {

    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const downStageCameraStateRef = useRef<CameraState | null>(null);
    const gKeyPressedRef = useRef<boolean>(false);

    const {
        hiddenEntities: [hiddenEntities, _hideEntity, _showEntity],
        hiddenEvents: [hiddenEvents, _hideEvent, _showEvent],
        causalProperties: [causalProperties, _addProperty, _removeProperty],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const {
        provenanceGraph: provenanceGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    } = useContext<ProvenanceGraphContextType>(ProvenanceGraphContext);

    if (!provenanceGraph) {
        return null;
    }

    const provenanceEngine = useRef<ProvenanceEngine | null>(null);
    

    const previousSelectedNodes = useRef<string[]>(selectedNodes);
    const previousHiddenEntities = useRef<Entity[]>(hiddenEntities);


    useEffect(() => {
        
        const graph = sigma.getGraph();
        for (const node of selectedNodes) {
            if (!previousSelectedNodes.current.includes(node)) {
                graph.setNodeAttribute(node, 'highlighted', true);
                const neighbors = graph.neighbors(node)
                for (const neighbor of neighbors) {
                    graph.setNodeAttribute(neighbor, 'highlighted', true);
                }
            }
        }

        for (const node of previousSelectedNodes.current) {
            if (!selectedNodes.includes(node)) {
                graph.setNodeAttribute(node, 'highlighted', false);
                const neighbors = graph.neighbors(node)
                for (const neighbor of neighbors) {
                    graph.setNodeAttribute(neighbor, 'highlighted', false);
                }
            }
        }

        previousSelectedNodes.current = selectedNodes;

    }, [selectedNodes]);


    useEffect(() => {

        const graph = sigma.getGraph();
        for (const entity of hiddenEntities) {
            if ( !previousHiddenEntities.current.includes(entity) ) {
                const nodes = graph.filterNodes ((n) => graph.getNodeAttribute(n, 'entity') === entity);
                for (const node of nodes) {
                    graph.setNodeAttribute(node, 'hidden', true);
                }
            }
        }

        for (const entity of previousHiddenEntities.current) {
            if ( !hiddenEntities.includes(entity) ) {
                const nodes = graph.filterNodes ((n) => graph.getNodeAttribute(n, 'entity') === entity);
                for (const node of nodes) {
                    graph.setNodeAttribute(node, 'hidden', false);
                }
            }
        }

        previousHiddenEntities.current = hiddenEntities;

    }, [hiddenEntities])


    useEffect(() => {

        const graph = sigma.getGraph()
        graph.forEachNode((node) => {
            const event = graph.getNodeAttribute(node, "event")
            if (event) {
                graph.setNodeAttribute(node, 'hidden', hiddenEvents.includes(event))
            }   
        })
    }, [hiddenEvents])


    useEffect(() => {
        
        provenanceEngine.current = new ProvenanceEngine(provenanceGraph, causalProperties);
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === "KeyG") {
                gKeyPressedRef.current = true;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === "KeyG") {
                gKeyPressedRef.current = false;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, []);


    useEffect(() => {
        provenanceEngine.current?.updateCausalProperties(causalProperties)
     }, [causalProperties, provenanceGraph])


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


    const onDownNode = (e: SigmaNodeEventPayload) => {

        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;
        const isRightMouseButtonPressed = (e.event.original as MouseEvent).button === 2;
        const isShiftPressed = (e.event.original as MouseEvent).shiftKey;
        const isAltPressed = (e.event.original as MouseEvent).altKey;
        const isGPressed = gKeyPressedRef.current;

        const currentNode = e.node;


        // priority to right click
        if (isRightMouseButtonPressed) {
            onRightClickNode(e)
            return;
        }

        if (!isLeftMouseButtonPressed) return;

        if( isGPressed ){
            const address = sigma.getGraph().getNodeAttribute(e.node, "event").address;
            window.api.sendGClick(address);
        }

        if (isShiftPressed) {
            handleMultiSelection(currentNode);
        }

        if (isAltPressed) {
            const selectedObjectName = sigma.getGraph().getNodeAttribute(e.node, 'objectName');
            const sameObjectNameNodes = sigma.getGraph().filterNodes((node) => { 
                return sigma.getGraph().getNodeAttribute(node, 'objectName') === selectedObjectName 
            });
            setSelectedNodes(sameObjectNameNodes);
        }

        if (!isShiftPressed && !isAltPressed && !isGPressed) {
            handleSelectSingleNode(currentNode);
        }

        setDraggedNode(currentNode);
    }


    const resetColoring = () =>{

        const graph = provenanceGraph.graph;
        for (const node of graph.nodes()) {
            graph.setNodeAttribute(node, 'color', '#000000')
        }

        for (const edge of graph.edges()) {
            const event = graph.getEdgeAttribute(edge, 'event') as Event
            graph.setEdgeAttribute(edge, 'color', event.color)
        }
    }


    const showProvenanceFrom = (target: string | null) => {
        
        resetColoring();

        if ( !target ) {
            return;
        }

        const [assertedSubgraph, discardedSubgraph, uncertainSubgraph] = provenanceEngine.current?.getProvenanceFromNode(target)!
        
        console.warn("Asserte subgraph: ", assertedSubgraph)
        console.warn("Discarded subgraph: ", discardedSubgraph)
        console.warn("Uncertain subgraph: ", uncertainSubgraph)
        for (const node of provenanceGraph.graph.nodes()) {
            if ( uncertainSubgraph.hasNode(node) ) {
                provenanceGraph.graph.setNodeAttribute(node, 'color', 'orange')
            }
        }

        for (const node of provenanceGraph.graph.nodes()) {
            if ( assertedSubgraph.hasNode(node) ) {
                provenanceGraph.graph.setNodeAttribute(node, 'color', 'green')
            }
        }

        for (const node of provenanceGraph.graph.nodes()) {
            if ( discardedSubgraph.hasNode(node) ) {
                const inNeighbors = provenanceGraph.graph.inNeighbors(node)
                for (const neighbor of inNeighbors) {
                    provenanceGraph.graph.setNodeAttribute(neighbor, 'color', 'red')
                }
            }
        }

        for (const node of provenanceGraph.graph.nodes()) {
            if ( !uncertainSubgraph.hasNode(node) && 
                !assertedSubgraph.hasNode(node) && 
                !discardedSubgraph.hasNode(node) 
            ) {
                provenanceGraph.graph.setNodeAttribute(node, 'color', 'lightgrey')

                provenanceGraph.graph.edges(node).forEach((edge) => {
                    provenanceGraph.graph.setEdgeAttribute(edge, 'color', 'lightgrey')
                })
            }
        }
    }


    const onRightClickNode = (e: SigmaNodeEventPayload) => {
        showProvenanceFrom(e.node);
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
        downStageCameraStateRef.current = sigma.getCamera().getState();
    }


    const onStageMouseUp = (e: SigmaStageEventPayload) => {
        
        const isLeftMouseButtonPressed = (e.event.original as MouseEvent).button === 0;
        if ( ! isLeftMouseButtonPressed ) return;

        // handles too fast movement that results in upstage event
        if ( draggedNode !== null ) {
            setDraggedNode(null);
            return;
        }

        const startState = downStageCameraStateRef.current;
        if ( ! startState ) return;
        const currentCameraState = sigma.getCamera().getState();

        const hasCameraMoved = currentCameraState.x !== startState.x || currentCameraState.y !== startState.y;
        if ( ! hasCameraMoved) {
            setSelectedNodes([]);
        }

        downStageCameraStateRef.current = null;
    }


    const onRightClickStage = (_e: SigmaStageEventPayload) => {
        showProvenanceFrom(null);
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


export default ProvenanceGraphEvents;