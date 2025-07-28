
import { useContext, useEffect, useState } from 'react';
import '@react-sigma/core/lib/style.css';
import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'
import DirectedGraph from 'graphology'
import Sigma from 'sigma';

import Error from '@renderer/components/Misc/Error';

import GraphEvents from './TopologyGraphPanelEvents';
import { TopologyGraphContext } from './TopologyGraphContext';


interface GraphPanelProps {
    className?: string;
    isDirty: boolean;
    setIsDirty: (value: boolean) => void;
    getGraph: () => DirectedGraph;
}


const GraphPanel: React.FC<GraphPanelProps> = ({ className, isDirty, setIsDirty, getGraph }) => {

    const [sigma, setSigma] = useState<Sigma | null>(null);

    const { 
        topologyGraph: [topologyGraph, _setTopologyGraph], 
    } = useContext(TopologyGraphContext)

    useEffect(() => {
        if( sigma && isDirty ) {
            sigma.refresh()
            setIsDirty(false)
        }     
    }, [isDirty])

    if ( ! topologyGraph ){
        return <Error message='No graph loaded'/>
    }

    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
            <SigmaContainer ref={setSigma} graph={getGraph()} settings={{renderEdgeLabels: true, allowInvalidContainer: true}}>
                <ControlsContainer position={'bottom-right'}>
                    <ZoomControl />
                    <FullScreenControl />
                </ControlsContainer>
                <GraphEvents topologyGraph={topologyGraph}/>
            </SigmaContainer>
        </div>
        
    )
}

export default GraphPanel;

