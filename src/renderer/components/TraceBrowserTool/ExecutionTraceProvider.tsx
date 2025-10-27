
import { createContext, useState } from "react";

import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import { Event } from "@common/types"; 


interface ExecutionTraceContextType {
    executionTrace: ExecutionTrace | null,
    selectedEvent: [Event | null, React.Dispatch<React.SetStateAction<Event | null>>],
    hiddenObjects: [string[], (objectName: string) => void, (objectName: string) => void],
}


const ExecutionTraceContext = createContext<ExecutionTraceContextType>({
    executionTrace: null,
    selectedEvent: [null, () => {}],
    hiddenObjects: [[], () => {}, () => {}],
})


interface ExecutionTraceProviderType {
    trace: ExecutionTrace,
    children: React.ReactNode,
}


const ExecutionTraceProvider = ({ trace, children }: ExecutionTraceProviderType) => {

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenObjects, setHiddenObjects] = useState<string[]>([]);

    const hideObject = (objectName: string) => {
        setHiddenObjects((prev) => [...prev, objectName]);
    }

    const showObject = (objectName: string) => {
        setHiddenObjects((prev) => prev.filter((obj) => obj !== objectName));
    }

    const value: ExecutionTraceContextType = {
        executionTrace: trace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        hiddenObjects: [hiddenObjects, hideObject, showObject],
    }

    return (
        <ExecutionTraceContext.Provider value={value}>
            {children}
        </ExecutionTraceContext.Provider>
    )
}


export { ExecutionTraceProvider, ExecutionTraceContext };
export type { ExecutionTraceProviderType, ExecutionTraceContextType };

