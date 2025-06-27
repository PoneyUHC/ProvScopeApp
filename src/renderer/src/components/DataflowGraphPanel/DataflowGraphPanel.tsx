
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
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
//import SlidingPanel from '../SlidingPanel';



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

    const toggleNodeVersionsVisibility = (node: string) => {
        dataflowGraph.toggleVisible(node)
        setIsDirty(true)
    }

    useEffect(() => {

        if (!sigma) return;

        if (isDirty) {
            sigma.refresh();
            setIsDirty(false);
        }
    }, [isDirty])

    
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

    const getObjectNames = () => {
        const uniqueObjectNames = new Set<string>();  
        const graph = dataflowGraph.graph;

        graph.forEachNode((node) => {
            const currentObjectName = graph.getNodeAttribute(node, 'objectName');
            if (currentObjectName) {
                uniqueObjectNames.add(currentObjectName); 
            }
        });

        return Array.from(uniqueObjectNames)
    };

    
    useEffect(() => {
        const newItems = getObjectNames();
        setObjectNames(newItems);
        dataflowGraph.computeCoords(newItems);
    }, []);


    const onListChanged = (newOrder) => {
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DragDropListPanel itemNames={objectNames} onListChanged={onListChanged} onRemove={onRemove} />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                    <List sx={{ maxHeight: 300, overflowY: 'auto', position: 'relative', pr: 1 }} >
                        {removedItems.map(({ name, index }) => (
                            <ListItem key={name} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f9f9f9', mb: 1, borderRadius: 1,}}>
                                <span>{name}</span>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => onRestore(name, index)}
                                    sx={{
                                        bgcolor: '#d3d3d3', 
                                        color: 'black','&:hover': {bgcolor: '#bfbfbf'},
                                    }}
                                >
                                    👁
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>
        </div>
        
    )
}

export default DataflowGraphPanel;

