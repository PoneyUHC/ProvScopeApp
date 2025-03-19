
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

import Error from '@renderer/components/Error';
import Sigma from 'sigma';

interface GraphPanelProps {
    className?: string;
    isDirty: boolean;
    setIsDirty: (value: boolean) => void;
}


const GraphPanel: React.FC<GraphPanelProps> = ({ className, isDirty, setIsDirty }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);

    const { ipcTraceGraph: ipcTraceGraphState } = useContext<IPCTraceGraphContextType>(IPCTraceGraphContext)
    const [ipcTraceGraph, _setIpcTraceGraph] = ipcTraceGraphState

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
            <SigmaContainer ref={setSigma} graph={ipcTraceGraph.getGraph()} settings={{renderEdgeLabels: true, allowInvalidContainer: true}}>
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

