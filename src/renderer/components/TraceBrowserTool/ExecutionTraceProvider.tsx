
import { createContext, useState } from "react";

import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import { Entity, Event } from "@common/types"; 


interface ExecutionTraceContextType {
    executionTrace: ExecutionTrace | null,
    selectedEvent: [Event | null, React.Dispatch<React.SetStateAction<Event | null>>],
    hiddenEntities: [Entity[], (entity: Entity) => void, (entity: Entity) => void],
}


const ExecutionTraceContext = createContext<ExecutionTraceContextType>({
    executionTrace: null,
    selectedEvent: [null, () => {}],
    hiddenEntities: [[], () => {}, () => {}],
})


interface ExecutionTraceProviderType {
    trace: ExecutionTrace,
    children: React.ReactNode,
}


const ExecutionTraceProvider = ({ trace, children }: ExecutionTraceProviderType) => {

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenEntities, setHiddenEntities] = useState<Entity[]>([]);

    const hideEntity = (entityName: Entity) => {
        setHiddenEntities((prev) => [...prev, entityName]);
    }

    const showEntity = (entityName: Entity) => {
        setHiddenEntities((prev) => prev.filter((obj) => obj !== entityName));
    }

    const value: ExecutionTraceContextType = {
        executionTrace: trace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
    }

    return (
        <ExecutionTraceContext.Provider value={value}>
            {children}
        </ExecutionTraceContext.Provider>
    )
}


export { ExecutionTraceProvider, ExecutionTraceContext };
export type { ExecutionTraceProviderType, ExecutionTraceContextType };

