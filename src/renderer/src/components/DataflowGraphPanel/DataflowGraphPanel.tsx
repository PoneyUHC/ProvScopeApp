
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

interface DataflowGraphPanelProps {
    className?: string;
    dataflowGraph: DataflowGraph;
}


const DataflowGraphPanel: React.FC<DataflowGraphPanelProps> = ({ className, dataflowGraph }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);
    const [isDirty, setIsDirty] = useState(false);


    const toggleNodeVersionsVisibility = (node: string) => {
        dataflowGraph.toggleVisible(node)
        setIsDirty(true)
    }

    useEffect(() => {

        if (!dataflowGraph) return;
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
                />
            </SigmaContainer>
        </div>
        
    )
}

export default DataflowGraphPanel;

