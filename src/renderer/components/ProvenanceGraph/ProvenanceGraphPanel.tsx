
import { useContext, useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';
import '@react-sigma/core/lib/style.css';
import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'
import { NodeSquareProgram } from "@sigma/node-square";
import { NodeCircleProgram } from "sigma/rendering"

import { Allotment } from 'allotment';

import DragDropListPanel from '@renderer/components/Misc/DragDropListPanel';
import Error from '@renderer/components/Misc/Error';
import { PatternGroup } from '@common/causality';

import ProvenanceGraphEvents from './ProvenanceGraphEvents';
import PatternPanel from './PatternPanel';
import EventInfosPanel from './EventInfosPanel';
import { ProvenanceGraphContextType, ProvenanceGraphContext } from './ProvenanceGraphProvider';
import { ExecutionTraceContext, ExecutionTraceContextType } from '../TraceBrowserTool/ExecutionTraceProvider';


const provenanceGraphPanel: React.FC = () => {

    const {
        hiddenObjects: [hiddenObjects, hideObject, showObject],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const [sigma, setSigma] = useState<Sigma | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [orderedObjectNames, setOrderedObjectNames] = useState<string[]>([]);

    const hiddenObjectsIndexLookup = useRef<Map<string, number>>(new Map());
    const [patternGroups, setPatternGroups] = useState<Set<PatternGroup>>(new Set());

    const { 
        provenanceGraph: provenanceGraph 
    } = useContext<ProvenanceGraphContextType>(ProvenanceGraphContext);
    
    if (!provenanceGraph) {
        return <Error message={"Provenance graph is not available."} />;
    }

    const previousHiddenObjects = useRef<string[]>(hiddenObjects);


    const getObjectNames = (): Set<string> => {
        const graph = provenanceGraph.graph;
        const objectNames = graph.mapNodes((node) => graph.getNodeAttribute(node, 'objectName'));
        return new Set(objectNames)
    };

    useEffect(() => {
        const newItems = Array.from(getObjectNames());
        setOrderedObjectNames(newItems);
        provenanceGraph.computeCoords(newItems);
    }, []);

    useEffect(() => {
        if (!sigma) return;
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }, [sigma]);

    useEffect(() => {
        if (!sigma) return;

        if (isDirty) {
            sigma.refresh();
            setIsDirty(false);
        }
    }, [isDirty])

    useEffect(() => {

        for (const objectName of hiddenObjects) {
            if ( !previousHiddenObjects.current.includes(objectName) ) {
                const index = orderedObjectNames.indexOf(objectName);
                hiddenObjectsIndexLookup.current.set(objectName, index);
                const newList = [...orderedObjectNames];
                newList.splice(index, 1);
                hiddenObjectsIndexLookup.current.set(objectName, index);
                setOrderedObjectNames(newList);
            }
        }

        for (const objectName of previousHiddenObjects.current) {
            if ( !hiddenObjects.includes(objectName) ) {
                const index = hiddenObjectsIndexLookup.current.get(objectName) || 0;
                const safeIndex = Math.min(index, orderedObjectNames.length);
                const newList = [...orderedObjectNames.slice(0, safeIndex), objectName, ...orderedObjectNames.slice(safeIndex)]; //we add the name at it's original place
                hiddenObjectsIndexLookup.current.delete(objectName);
                setOrderedObjectNames(newList);
            }
        }

        previousHiddenObjects.current = hiddenObjects;
        
    }, [hiddenObjects]);
    

    const showProvenanceFrom = (target: string | null) => {

        if ( !target ) {
            provenanceGraph.resetColoring()
            return;
        }

        const provenance = provenanceGraph.computeProvenanceFrom(target)

        const graph = provenanceGraph.graph

        graph.forEachNode((node) => {
            graph.removeNodeAttribute(node, 'color')
            if( provenance.has(node) ) {
                graph.setNodeAttribute(node, 'color', 'red')
            }
        })
        
        graph.forEachEdge((edge) => {

            const source = graph.source(edge)
            const target = graph.target(edge)

            if (provenance.has(source) && provenance.has(target)) {
                const eventType = graph.getEdgeAttribute(edge, 'event').eventType
                if (eventType === 'ExitReadEvent') {
                    graph.setEdgeAttribute(edge, 'color', 'green')
                } else if (eventType === 'WriteEvent') {
                    graph.setEdgeAttribute(edge, 'color', 'blue')
                }
            } else {
                graph.removeEdgeAttribute(edge, 'color')
            }
        })
    }


    const onListChanged = (newOrder: string[]) => {
        provenanceGraph.computeCoords(newOrder);
        setOrderedObjectNames(newOrder);
    };


    const onRemove = (name: string, index: number) => {
        hideObject(name);
    }


    const onRestore = (name: string) => {
        showObject(name);
    }


    const onDrag = () => {
        setIsDirty(true);
    }


    const addPatternGroup = (patternGroup: PatternGroup) => {
        setPatternGroups(prev => new Set([...prev, patternGroup]));
    }


    const removePatternGroup = (patternGroup: PatternGroup) => {
        setPatternGroups(prev => new Set([...prev].filter(pg => pg !== patternGroup)));
    }


    return (
        <div className={`flex items-center justify-center font-mono h-full`}>
             <Allotment onDragEnd={onDrag}>
                <Allotment.Pane minSize={200} preferredSize={"90%"} className="h-full w-full">

                    <SigmaContainer 
                        ref={setSigma} 
                        graph={provenanceGraph.graph} 
                        settings={
                            {
                                renderLabels: false,
                                allowInvalidContainer: true, 
                                nodeProgramClasses: {
                                    square: NodeSquareProgram,
                                    circle: NodeCircleProgram,
                                }
                            }
                        }>
                        <ControlsContainer position={'bottom-right'}>
                            <ZoomControl />
                            <FullScreenControl />
                        </ControlsContainer>
                        <ProvenanceGraphEvents 
                            showProvenanceFrom={showProvenanceFrom}
                        />

                        <EventInfosPanel />

                        <PatternPanel
                            patternGroups={patternGroups}
                            addPatternGroup={addPatternGroup}
                            removePatternGroup={removePatternGroup}
                        />

                    </SigmaContainer>
                
                </Allotment.Pane>

                <Allotment.Pane minSize={200} preferredSize={"10%"}>

                    <Allotment vertical={true}>
                        <Allotment.Pane minSize={200} preferredSize={"70%"}>
                            <div className='overflow-auto h-full w-full bg-gray-100 rounded-lg shadow-md'>
                                <DragDropListPanel itemNames={orderedObjectNames} onListChanged={onListChanged} onRemove={onRemove} />
                            </div>
                        </Allotment.Pane>
                        <Allotment.Pane minSize={200} preferredSize={"30%"} className="w-full h-full overflow-auto">
                            <div className='overflow-auto h-full w-full bg-gray-100 rounded-lg shadow-md'>
                                {
                                    hiddenObjects.map((objectName) => (
                                        <div className="w-full flex justify-between bg-[#f9f9f9] mb-2 rounded-md p-2" >
                                            {objectName}
                                            <button className="bg-[#d3d3d3] text-black px-3 py-1 rounded hover:bg-[#bfbfbf] transition-colors duration-200" 
                                                    onClick={() => onRestore(objectName)} 
                                            >
                                                👁
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                        </Allotment.Pane>
                    </Allotment>
        
                </Allotment.Pane>
            </Allotment>
        </div>
    )
}

export default provenanceGraphPanel;

