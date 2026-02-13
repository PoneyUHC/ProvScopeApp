
import { createContext, useState } from "react";

import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import { Entity, Event } from "@common/types";
import { CausalProperty } from "@common/Provenance/IntraProcess/CausalProperty"; 


interface ExecutionTraceContextType {
    executionTrace: ExecutionTrace | null,
    selectedEvent: [Event | null, React.Dispatch<React.SetStateAction<Event | null>>],
    hiddenEntities: [Entity[], (entity: Entity) => void, (entity: Entity) => void],
    hiddenEvents: [Event[], (event: Event) => void, (event: Event) => void],
    causalProperties: [CausalProperty[], (property: CausalProperty) => void, (property: CausalProperty) => void]
}


const ExecutionTraceContext = createContext<ExecutionTraceContextType>({
    executionTrace: null,
    selectedEvent: [null, () => {}],
    hiddenEntities: [[], () => {}, () => {}],
    hiddenEvents: [[], () => {}, () => {}],
    causalProperties: [[], () => {}, () => {}]
})


interface ExecutionTraceProviderType {
    trace: ExecutionTrace,
    children: React.ReactNode,
}


const ExecutionTraceProvider = ({ trace, children }: ExecutionTraceProviderType) => {

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [hiddenEntities, setHiddenEntities] = useState<Entity[]>([]);
    const [hiddenEvents, setHiddenEvents] = useState<Event[]>([]);
    const [causalProperties, setCausalProperties] = useState<CausalProperty[]>([]);

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

    const addProperty = (property: CausalProperty) => {
        setCausalProperties((prev) => [...prev, property]);
    }

    const removeProperty = (property: CausalProperty) => {
        setCausalProperties((prev) => prev.filter((obj) => obj !== property));
    }

    const value: ExecutionTraceContextType = {
        executionTrace: trace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
        hiddenEvents: [hiddenEvents, hideEvent, showEvent],
        causalProperties: [causalProperties, addProperty, removeProperty]
    }

    return (
        <ExecutionTraceContext.Provider value={value}>
            {children}
        </ExecutionTraceContext.Provider>
    )
}


export { ExecutionTraceProvider, ExecutionTraceContext };
export type { ExecutionTraceProviderType, ExecutionTraceContextType };

