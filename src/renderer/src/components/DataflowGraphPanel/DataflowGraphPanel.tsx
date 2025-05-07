
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
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
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

    useEffect(() => {

        if( !selectedNode ) return;

        const dataflow = dataflowGraph.computeDataflowFrom(selectedNode)

        const graph = dataflowGraph.graph

        graph.forEachNode((node) => {
            graph.removeNodeAttribute(node, 'color')
            for(const dfNode of dataflow) {
                if (node === dfNode) {
                    graph.setNodeAttribute(node, 'color', 'red')
                }
            }
        })
        
        graph.forEachEdge((edge) => {

            const source = graph.source(edge)
            const target = graph.target(edge)

            if (dataflow.has(source) && dataflow.has(target)) {
                const eventType = graph.getEdgeAttribute(edge, 'eventType')
                if (eventType === 'read') {
                    graph.setEdgeAttribute(edge, 'color', 'green')
                } else {
                    graph.setEdgeAttribute(edge, 'color', 'blue')
                }
            } else {
                graph.removeEdgeAttribute(edge, 'color')
            }
        })
    }, [selectedNode])


    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
            <SigmaContainer 
                ref={setSigma} 
                graph={dataflowGraph.graph} 
                settings={
                    {
                        renderEdgeLabels: true,
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
                    setSelectedNode={setSelectedNode} 
                    toggleNodeVersionsVisibility={toggleNodeVersionsVisibility}
                />
            </SigmaContainer>
        </div>
        
    )
}

export default DataflowGraphPanel;

