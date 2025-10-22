
import { createContext, useContext, useState, useEffect } from "react";

import ProvenanceGraph from "@common/ProvenanceGraph";
import { ExecutionTraceContext, ExecutionTraceContextType } from "../TraceBrowserTool/ExecutionTraceProvider";


interface ProvenanceGraphContextType {
    provenanceGraph: ProvenanceGraph | null,
    selectedNodes: [string[], (nodes: string[] | ((prevValue: string[]) => string[])) => void],
}


const ProvenanceGraphContext = createContext<ProvenanceGraphContextType>({
    provenanceGraph: null,
    selectedNodes: [[], () => {}],
})


interface ProvenanceGraphProviderType {
    provenanceGraph: ProvenanceGraph,
    children: React.ReactNode,
}


const ProvenanceGraphProvider = ({ provenanceGraph: provenanceGraph, children }: ProvenanceGraphProviderType) => {

    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const {
        selectedEvent: [_selectedEvent, setSelectedEvent]
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext)


    useEffect(() => {
        if (selectedNodes.length === 0) {
            setSelectedEvent(null);
            return;
        }
        const event = provenanceGraph.graph.getNodeAttribute(selectedNodes[0], 'event');
        setSelectedEvent(event)
    }, [selectedNodes, provenanceGraph, setSelectedEvent]);
    

    const value: ProvenanceGraphContextType = {
        provenanceGraph: provenanceGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    };

    return (
        <ProvenanceGraphContext.Provider value={value}>
            {children}
        </ProvenanceGraphContext.Provider>
    )
}


export { ProvenanceGraphProvider, ProvenanceGraphContext };
export type { ProvenanceGraphProviderType, ProvenanceGraphContextType };

