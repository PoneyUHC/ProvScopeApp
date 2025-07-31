
import { createContext } from "react";

import DataflowGraph from "@common/DataflowGraph";


interface DataflowGraphContextType {
    dataflowGraph: DataflowGraph | null,
}


const DataflowGraphContext = createContext<DataflowGraphContextType>({
    dataflowGraph: null,
})


interface DataflowGraphProviderType {
    dataflowGraph: DataflowGraph,
    children: React.ReactNode,
}


const DataflowGraphProvider = ({ dataflowGraph, children }: DataflowGraphProviderType) => {

    const value: DataflowGraphContextType = {
        dataflowGraph: dataflowGraph,
    };

    return (
        <DataflowGraphContext.Provider value={value}>
            {children}
        </DataflowGraphContext.Provider>
    )
}


export { DataflowGraphProvider, DataflowGraphContext };
export type { DataflowGraphProviderType, DataflowGraphContextType };

