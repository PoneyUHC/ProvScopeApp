
import { createContext, useState } from "react";

import { TopologyGraph } from "@common/TopologyGraph";


interface TopologyGraphContextType {
    topologyGraph: TopologyGraph | null,
    selectedNodes: [string[], (nodes: string[] | ((prevValue: string[]) => string[])) => void],
}


const TopologyGraphContext = createContext<TopologyGraphContextType>({
    topologyGraph: null,
    selectedNodes: [[], () => {}],
})


interface TopologyGraphProviderType {
    topologyGraph: TopologyGraph,
    children: React.ReactNode,
}


const TopologyGraphProvider = ({ topologyGraph, children }: TopologyGraphProviderType) => {
    
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    
    
    const value: TopologyGraphContextType = {
        topologyGraph: topologyGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    };

    return (
        <TopologyGraphContext.Provider value={value}>
            {children}
        </TopologyGraphContext.Provider>
    )
}


export { TopologyGraphProvider, TopologyGraphContext };
export type { TopologyGraphProviderType, TopologyGraphContextType };

