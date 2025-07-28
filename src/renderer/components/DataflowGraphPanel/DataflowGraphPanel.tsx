
import { useEffect, useState } from 'react';
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
import { PatternGroup } from '@common/causality';
import DataflowGraph from '@common/DataflowGraph';
import { Event } from '@common/types';

import DataflowGraphEvents from './DataflowGraphEvents';
import PatternPanel from './PatternPanel';
import EventInfosPanel from './EventInfosPanel';


interface DataflowGraphPanelProps {
    className?: string;
    dataflowGraph: DataflowGraph;
}


const DataflowGraphPanel: React.FC<DataflowGraphPanelProps> = ({ className, dataflowGraph }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [objectNames, setObjectNames] = useState<string[]>([]);
    const [removedItems, setRemovedItems] = useState<{ name: string, index: number }[]>([]);
    const [patternGroups, setPatternGroups] = useState<Set<PatternGroup>>(new Set());


    const getObjectNames = (): Set<string> => {
        const graph = dataflowGraph.graph;
        const objectNames = graph.mapNodes((node) => graph.getNodeAttribute(node, 'objectName'));
        return new Set(objectNames)
    };


    useEffect(() => {
        const newItems = Array.from(getObjectNames());
        setObjectNames(newItems);
        dataflowGraph.computeCoords(newItems);
    }, []);


    useEffect(() => {

        if (!sigma) return;

        if (isDirty) {
            sigma.refresh();
            setIsDirty(false);
        }
    }, [isDirty])


    const toggleNodeVersionsVisibility = (node: string) => {
        dataflowGraph.toggleVisible(node)
        setIsDirty(true)
    }
    

    const showDataflowFrom = (target: string | null) => {

        if ( !target ) {
            dataflowGraph.resetColoring()
            return;
        }

        const dataflow = dataflowGraph.computeDataflowFrom(target)

        const graph = dataflowGraph.graph

        graph.forEachNode((node) => {
            graph.removeNodeAttribute(node, 'color')
            if( dataflow.has(node) ) {
                graph.setNodeAttribute(node, 'color', 'red')
            }
        })
        
        graph.forEachEdge((edge) => {

            const source = graph.source(edge)
            const target = graph.target(edge)

            if (dataflow.has(source) && dataflow.has(target)) {
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
        dataflowGraph.computeCoords(newOrder);
        setObjectNames(newOrder);
    };


    const onRemove = (name: string, index: number) => {
        const newList = [...objectNames];
        newList.splice(index, 1);

        dataflowGraph.graph.forEachNode( (node: string) => {
            const currentObjectName = dataflowGraph.graph.getNodeAttribute(node, 'objectName');
            if(currentObjectName === name){
                dataflowGraph.graph.setNodeAttribute(node, 'hidden', true)
            }
        })

        setObjectNames(newList);
        setRemovedItems(prev => [...prev, { name, index }]);
    }


    const onRestore = (name: string, index: number) => {
        const safeIndex = Math.min(index, objectNames.length);
        const newList = [...objectNames.slice(0, safeIndex), name, ...objectNames.slice(safeIndex)]; //we add the name at it's original place 

        dataflowGraph.graph.forEachNode( (node: string) => {
            const currentObjectName = dataflowGraph.graph.getNodeAttribute(node, 'objectName');
            if(currentObjectName === name){
                dataflowGraph.graph.setNodeAttribute(node, 'hidden', false)
            }
        })

        setObjectNames(newList);
        setRemovedItems(prev => prev.filter(item => item.name !== name));
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
        <div className={`flex items-center justify-center font-mono ${className}`}>
             <Allotment onDragEnd={onDrag}>
                <Allotment.Pane minSize={200} preferredSize={"90%"} className="h-full w-full">

                    <SigmaContainer 
                        ref={setSigma} 
                        graph={dataflowGraph.graph} 
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
                        <DataflowGraphEvents 
                            showDataflowFrom={showDataflowFrom} 
                            toggleNodeVersionsVisibility={toggleNodeVersionsVisibility}
                            setDetailsEvent={setDetailsEvent}
                            selectedNodes={selectedNodes}
                            setSelectedNodes={setSelectedNodes}
                        />

                        <EventInfosPanel event={detailsEvent} />

                        <PatternPanel 
                            dataflowGraph={dataflowGraph} 
                            selectedNodes={selectedNodes}
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
                                <DragDropListPanel itemNames={objectNames} onListChanged={onListChanged} onRemove={onRemove} />
                            </div>
                        </Allotment.Pane>
                        <Allotment.Pane minSize={200} preferredSize={"30%"} className="w-full h-full overflow-auto">
                            <div className='overflow-auto h-full w-full bg-gray-100 rounded-lg shadow-md'>
                                {
                                    removedItems.map(({ name, index }) => (
                                        <div className="w-full flex justify-between bg-[#f9f9f9] mb-2 rounded-md p-2" >
                                            {name}
                                            <button className="bg-[#d3d3d3] text-black px-3 py-1 rounded hover:bg-[#bfbfbf] transition-colors duration-200" 
                                                    onClick={() => onRestore(name, index)} 
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

export default DataflowGraphPanel;

