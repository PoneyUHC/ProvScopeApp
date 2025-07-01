
import '@react-sigma/core/lib/style.css';

import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'

import { NodeSquareProgram } from "@sigma/node-square";
import { NodeCircleProgram } from "sigma/rendering"

import DataflowGraphEvents from '@renderer/components/DataflowGraphPanel/DataflowGraphEvents';
import { useEffect, useState } from 'react';

import Sigma from 'sigma';
import DataflowGraph from '@common/DataflowGraph';
import EventInfosPanel from './EventInfosPanel';

import { Event } from '@common/types';
import DragDropListPanel from '../DragDropListPanel';



interface DataflowGraphPanelProps {
    className?: string;
    dataflowGraph: DataflowGraph;
}


const DataflowGraphPanel: React.FC<DataflowGraphPanelProps> = ({ className, dataflowGraph }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
    const [objectNames, setObjectNames] = useState<string[]>([]); //Array of objectName related to the graph lines
    const [removedItems, setRemovedItems] = useState<{ name: string, index: number }[]>([]);


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


    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
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
                />

                <EventInfosPanel event={detailsEvent} />
            </SigmaContainer>
            
            <div className="flex flex-col gap-2" >
                <DragDropListPanel itemNames={objectNames} onListChanged={onListChanged} onRemove={onRemove} />

                <div className="w-full max-w-[360px] bg-white max-h-[300px] overflow-y-auto relative pr-4" >
                {
                    removedItems.map(({ name, index }) => (
                        <li className="flex justify-between bg-[#f9f9f9] mb-2 rounded-md p-2" >
                            {name}
                            <button className="bg-[#d3d3d3] text-black px-3 py-1 rounded hover:bg-[#bfbfbf] transition-colors duration-200" 
                                    onClick={() => onRestore(name, index)} 
                            >
                                👁
                            </button>
                        </li>
                    ))
                }
                </div>
            </div>
        </div>
        
    )
}

export default DataflowGraphPanel;

