
import '@react-sigma/core/lib/style.css';
import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'
import Sigma from 'sigma';

import { TopologyGraph } from '@common/TopologyGraph';

import GraphEvents from './TopologyGraphPanelEvents';


interface TopologyGraphPanelProps {
    className?: string;
    topologyGraph: TopologyGraph;
    setSigma: (sigma: Sigma) => void;
}


const TopologyGraphPanel: React.FC<TopologyGraphPanelProps> = ({ className, topologyGraph, setSigma }) => {

    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
            <SigmaContainer 
                ref={setSigma} 
                graph={topologyGraph.getGraph()} 
                settings={{
                    renderEdgeLabels: true, 
                    allowInvalidContainer: true
                }}
            >
                <ControlsContainer position={'bottom-right'}>
                    <ZoomControl />
                    <FullScreenControl />
                </ControlsContainer>
                <GraphEvents topologyGraph={topologyGraph}/>
            </SigmaContainer>
        </div>
        
    )
}

export default TopologyGraphPanel;

