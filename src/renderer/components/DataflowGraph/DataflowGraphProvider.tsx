
import { createContext, useContext, useState } from "react";

import DataflowGraph from "@common/DataflowGraph";
import { ExecutionTraceContext, ExecutionTraceContextType } from "../TraceBrowserTool/ExecutionTraceProvider";


interface DataflowGraphContextType {
    dataflowGraph: DataflowGraph | null,
    selectedNodes: [string[], (nodes: string[] | ((prevValue: string[]) => string[])) => void],
}


const DataflowGraphContext = createContext<DataflowGraphContextType>({
    dataflowGraph: null,
    selectedNodes: [[], () => {}],
})


interface DataflowGraphProviderType {
    dataflowGraph: DataflowGraph,
    children: React.ReactNode,
}


const DataflowGraphProvider = ({ dataflowGraph, children }: DataflowGraphProviderType) => {

    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const {
        selectedEvent: [_selectedEvent, setSelectedEvent]
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext)

    const externalSetSelectedNodes = (valueOrUpdater: string[] | ((prevNodes: string[]) => string[])) => {

        const newValue = 
            typeof valueOrUpdater === 'function'
                ? valueOrUpdater(selectedNodes)
                : valueOrUpdater

        setSelectedNodes(newValue);

        if (newValue.length === 0) {
            setSelectedEvent(null);
            return;
        }
        const event = dataflowGraph.graph.getNodeAttribute(newValue[0], 'event');
        setSelectedEvent(event)
    }

    const value: DataflowGraphContextType = {
        dataflowGraph: dataflowGraph,
        selectedNodes: [selectedNodes, externalSetSelectedNodes],
    };

    return (
        <DataflowGraphContext.Provider value={value}>
            {children}
        </DataflowGraphContext.Provider>
    )
}


export { DataflowGraphProvider, DataflowGraphContext };
export type { DataflowGraphProviderType, DataflowGraphContextType };

