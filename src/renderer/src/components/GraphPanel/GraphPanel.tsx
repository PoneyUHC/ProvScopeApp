
import '@react-sigma/core/lib/style.css';

import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'

import GraphEvents from './GraphEvents';
import { useContext, useEffect, useState } from 'react';
import { IPCTraceGraphContext, IPCTraceGraphContextType } from '../IPCTraceGraphContext';

import DirectedGraph from 'graphology'

import Error from '@renderer/components/Error';
import Sigma from 'sigma';

interface GraphPanelProps {
    className?: string;
    isDirty: boolean;
    setIsDirty: (value: boolean) => void;
    getGraph: () => DirectedGraph;
}


const GraphPanel: React.FC<GraphPanelProps> = ({ className, isDirty, setIsDirty, getGraph }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);

    const { 
        ipcTraceGraph: [ipcTraceGraph, _setIpcTraceGraph], 
    } = useContext(IPCTraceGraphContext)

    useEffect(() => {
        if( sigma && isDirty ) {
            sigma.refresh()
            setIsDirty(false)
        }     
    }, [isDirty])

    if ( ! ipcTraceGraph ){
        return <Error message='No graph loaded'/>
    }

    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
            <SigmaContainer ref={setSigma} graph={getGraph()} settings={{renderEdgeLabels: true, allowInvalidContainer: true}}>
                <ControlsContainer position={'bottom-right'}>
                    <ZoomControl />
                    <FullScreenControl />
                </ControlsContainer>
                <GraphEvents ipcTraceGraph={ipcTraceGraph}/>
            </SigmaContainer>
        </div>
        
    )
}

export default GraphPanel;

