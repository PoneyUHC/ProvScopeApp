
import { createContext } from "react";

import { TopologyGraph } from "@common/TopologyGraph";


interface TopologyGraphContextType {
    topologyGraph: TopologyGraph | null,
}


const TopologyGraphContext = createContext<TopologyGraphContextType>({
    topologyGraph: null,
})


interface TopologyGraphProviderType {
    topologyGraph: TopologyGraph,
    children: React.ReactNode,
}


const TopologyGraphProvider = ({ topologyGraph, children }: TopologyGraphProviderType) => {

    const value: TopologyGraphContextType = {
        topologyGraph: topologyGraph,
    };

    return (
        <TopologyGraphContext.Provider value={value}>
            {children}
        </TopologyGraphContext.Provider>
    )
}


export { TopologyGraphProvider, TopologyGraphContext };
export type { TopologyGraphProviderType, TopologyGraphContextType };

