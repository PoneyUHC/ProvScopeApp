
import { useContext } from 'react';
import '@react-sigma/core/lib/style.css';
import {
    SigmaContainer,
    ControlsContainer,
    FullScreenControl,
    ZoomControl,
} from '@react-sigma/core'
import Sigma from 'sigma';

import Error from '@renderer/components/Misc/Error';

import { TopologyGraphContext, TopologyGraphContextType } from '../TopologyGraphProvider';
import TopologyGraphEvents from './TopologyGraphPanelEvents';


interface TopologyGraphPanelProps {
    className?: string;
    setSigma: (sigma: Sigma) => void;
}


const TopologyGraphPanel: React.FC<TopologyGraphPanelProps> = ({ className, setSigma }) => {

    const { 
        topologyGraph 
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return <Error message={"Topology graph is not available."} />;
    }


    return (
        <div className={`flex items-center justify-center font-mono ${className}`}>
            <SigmaContainer 
                ref={setSigma} 
                graph={topologyGraph.graph} 
                settings={{
                    renderEdgeLabels: true, 
                    allowInvalidContainer: true
                }}
            >
                <ControlsContainer position={'bottom-right'}>
                    <ZoomControl />
                    <FullScreenControl />
                </ControlsContainer>
                <TopologyGraphEvents/>
            </SigmaContainer>
        </div>
        
    )
}

export default TopologyGraphPanel;

