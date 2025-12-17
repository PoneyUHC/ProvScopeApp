
import { createContext, useState } from "react";

import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import { Entity, Event } from "@common/types"; 


interface ExecutionTraceContextType {
    executionTrace: ExecutionTrace | null,
    selectedEvent: [Event | null, React.Dispatch<React.SetStateAction<Event | null>>],
    hiddenEntities: [Entity[], (entity: Entity) => void, (entity: Entity) => void],
    hiddenEvents: [Event[], (event: Event) => void, (event: Event) => void]
}


const ExecutionTraceContext = createContext<ExecutionTraceContextType>({
    executionTrace: null,
    selectedEvent: [null, () => {}],
    hiddenEntities: [[], () => {}, () => {}],
    hiddenEvents: [[], () => {}, () => {}]
})


interface ExecutionTraceProviderType {
    trace: ExecutionTrace,
    children: React.ReactNode,
}


const ExecutionTraceProvider = ({ trace, children }: ExecutionTraceProviderType) => {

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenEntities, setHiddenEntities] = useState<Entity[]>([]);
    const [hiddenEvents, setHiddenEvents] = useState<Event[]>([]);

    const hideEntity = (entityName: Entity) => {
        setHiddenEntities((prev) => [...prev, entityName]);
    }

    const showEntity = (entityName: Entity) => {
        setHiddenEntities((prev) => prev.filter((obj) => obj !== entityName));
    }

    const hideEvent = (event: Event) => {
        setHiddenEvents((prev) => [...prev, event]);
    }

    const showEvent = (event: Event) => {
        setHiddenEvents((prev) => prev.filter((obj) => obj !== event));
    }

    const value: ExecutionTraceContextType = {
        executionTrace: trace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
        hiddenEvents: [hiddenEvents, hideEvent, showEvent]
    }

    return (
        <ExecutionTraceContext.Provider value={value}>
            {children}
        </ExecutionTraceContext.Provider>
    )
}


export { ExecutionTraceProvider, ExecutionTraceContext };
export type { ExecutionTraceProviderType, ExecutionTraceContextType };

