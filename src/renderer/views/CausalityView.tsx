
import React, { useContext, useMemo, useState } from "react";

import { ExecutionTraceContext } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";
import { Entity, Event, Process } from "@common/types";
import { EventPattern, PatternGroup, PatternValue } from "@common/Provenance/ProvenanceEngine";
import Title from "@renderer/components/Misc/Title";


interface PatternConfig {
    id: number;
    processUUID: string;
    eventIndex: number | null;
    lockedFields: string[];
}


const createEmptyPatternConfig = (): PatternConfig => ({
    id: Date.now() + Math.random(),
    processUUID: "",
    eventIndex: null,
    lockedFields: [],
});


const describeEntity = (entity: Entity): string => {
    try {
        return entity.getUUID();
    } catch {
        return String(entity);
    }
};

const getEventFieldValue = (event: Event, field: string): unknown => {
    const record = event as unknown as Record<string, unknown>;
    return record[field];
};

const formatFieldValue = (value: unknown): string => {
    if (value instanceof Set) {
        return Array.from(value.values())
            .map((item) => (typeof item === "object" && item !== null ? describeEntity(item as Entity) : String(item)))
            .join(", ");
    }

    if (value instanceof Process) {
        return `${value.name} (${value.pid})`;
    }

    if (typeof value === "object" && value !== null) {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    return String(value);
};


const buildEventPattern = (config: PatternConfig, events: Event[]): EventPattern | null => {
    if (config.eventIndex === null || config.eventIndex < 0 || config.eventIndex >= events.length) {
        return null;
    }

    const baseEvent = events[config.eventIndex];
    if (!baseEvent) {
        return null;
    }

    if (config.lockedFields.length === 0) {
        return null;
    }

    const pattern = new Map<string, PatternValue>();
    pattern.set("process", new PatternValue(baseEvent.process, false));

    for (const field of config.lockedFields) {
        const fieldValue = getEventFieldValue(baseEvent, field);
        pattern.set(field, new PatternValue(fieldValue, false));
    }

    return new EventPattern(pattern);
};


interface PatternConfiguratorProps {
    index: number;
    config: PatternConfig;
    processes: Process[];
    availableEvents: { index: number; label: string }[];
    selectedEvent: Event | null;
    onProcessChange: (configId: number, nextUUID: string) => void;
    onEventChange: (configId: number, nextIndex: number | null) => void;
    onToggleField: (configId: number, field: string) => void;
    onRemove: (configId: number) => void;
    lockedFields: string[];
    matchesCount: number;
    disableRemove: boolean;
}


const PatternConfigurator: React.FC<PatternConfiguratorProps> = ({
    index,
    config,
    processes,
    availableEvents,
    selectedEvent,
    onProcessChange,
    onEventChange,
    onToggleField,
    onRemove,
    lockedFields,
    matchesCount,
    disableRemove,
}) => {
    const fieldEntries = useMemo(() => {
        if (!selectedEvent) {
            return [] as { field: string; display: string }[];
        }

        return Object.entries(selectedEvent as unknown as Record<string, unknown>)
            .filter(([field, value]) => field !== "process" && !(value instanceof Set))
            .map(([field, value]) => ({
                field,
                display: formatFieldValue(value),
            }));
    }, [selectedEvent]);

    const processOptions = useMemo(
        () =>
            processes.map((process) => ({
                uuid: process.getUUID(),
                label: `${process.name} (pid ${process.pid})`,
            })),
        [processes]
    );

    const hasProcess = Boolean(config.processUUID);
    const hasEvent = selectedEvent !== null;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Event pattern #{index + 1}</h3>
                <button
                    type="button"
                    onClick={() => onRemove(config.id)}
                    disabled={disableRemove}
                    className={`px-3 py-1 text-sm rounded ${
                        disableRemove
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                >
                    Remove
                </button>
            </div>

            <div className="mb-3 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Process
                    <select
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                        value={config.processUUID}
                        onChange={(event) => onProcessChange(config.id, event.target.value)}
                    >
                        <option value="">Select a process</option>
                        {processOptions.map((option) => (
                            <option key={option.uuid} value={option.uuid}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium">
                    Reference event
                    <select
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                        value={hasEvent && config.eventIndex !== null ? config.eventIndex : ""}
                        onChange={(event) =>
                            onEventChange(
                                config.id,
                                event.target.value === "" ? null : Number(event.target.value)
                            )
                        }
                        disabled={!hasProcess || availableEvents.length === 0}
                    >
                        <option value="">
                            {availableEvents.length === 0 ? "No events for this process" : "Select an event"}
                        </option>
                        {availableEvents.map((option) => (
                            <option key={option.index} value={option.index}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mb-3 rounded border border-dashed border-gray-300 p-3">
                <p className="mb-2 text-sm font-semibold">Field constraints</p>
                {!hasEvent && <p className="text-sm text-gray-500">Select a reference event to choose field values.</p>}
                {hasEvent && fieldEntries.length === 0 && (
                    <p className="text-sm text-gray-500">No fields available for matching on this event.</p>
                )}
                {hasEvent && fieldEntries.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {fieldEntries.map(({ field, display }) => {
                            const isLocked = lockedFields.includes(field);
                            return (
                                <li key={field} className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={isLocked}
                                        onChange={() => onToggleField(config.id, field)}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{field}</p>
                                        <p className="text-xs text-gray-600">{display}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <p className="text-sm text-gray-600">
                Matching events in trace: <span className="font-semibold">{matchesCount}</span>
            </p>
        </div>
    );
};


const CausalityView: React.FC = () => {
    const { executionTrace } = useContext(ExecutionTraceContext);

    const [patternName, setPatternName] = useState("");
    const [patternConfigs, setPatternConfigs] = useState<PatternConfig[]>(() => [createEmptyPatternConfig()]);
    const [createdGroups, setCreatedGroups] = useState<PatternGroup[]>([]);

    const processes = executionTrace?.processes ?? [];
    const events = executionTrace?.events ?? [];

    const firstEventIndexForProcess = (processUUID: string): number | null => {
        const index = events.findIndex((event) => event.process.getUUID() === processUUID);
        return index >= 0 ? index : null;
    };

    const getEventByIndex = (eventIndex: number | null): Event | null => {
        if (eventIndex === null) {
            return null;
        }
        return events[eventIndex] ?? null;
    };

    const computeMatches = (config: PatternConfig): number => {
        const pattern = buildEventPattern(config, events);
        if (!pattern) {
            return 0;
        }

        return events.reduce((count, event) => (pattern.matches(event) ? count + 1 : count), 0);
    };

    const addPatternConfig = () => {
        setPatternConfigs((prev) => [...prev, createEmptyPatternConfig()]);
    };

    const removePatternConfig = (configId: number) => {
        setPatternConfigs((prev) => prev.filter((config) => config.id !== configId));
    };

    const updateConfig = (configId: number, updater: (config: PatternConfig) => PatternConfig) => {
        setPatternConfigs((prev) => prev.map((config) => (config.id === configId ? updater(config) : config)));
    };

    const handleProcessChange = (configId: number, nextUUID: string) => {
        updateConfig(configId, (config) => {
            if (!nextUUID) {
                return { ...config, processUUID: "", eventIndex: null, lockedFields: [] };
            }

            const nextEventIndex = firstEventIndexForProcess(nextUUID);
            return {
                ...config,
                processUUID: nextUUID,
                eventIndex: nextEventIndex,
                lockedFields: [],
            };
        });
    };

    const handleEventChange = (configId: number, nextIndex: number | null) => {
        updateConfig(configId, (config) => ({
            ...config,
            eventIndex: nextIndex,
            lockedFields: [],
        }));
    };

    const handleToggleField = (configId: number, field: string) => {
        updateConfig(configId, (config) => {
            const isLocked = config.lockedFields.includes(field);
            return {
                ...config,
                lockedFields: isLocked
                    ? config.lockedFields.filter((current) => current !== field)
                    : [...config.lockedFields, field],
            };
        });
    };

    const availableEventsForProcess = (processUUID: string) => {
        if (!processUUID) {
            return [] as { index: number; label: string }[];
        }

        return events
            .map((event, index) => ({ event, index }))
            .filter(({ event }) => event.process.getUUID() === processUUID)
            .map(({ event, index }) => ({
                index,
                label: `#${event.id >= 0 ? event.id : index} • ${event.eventType} @ ${event.timestamp}`,
            }));
    };

    const resetForm = () => {
        setPatternName("");
        setPatternConfigs([createEmptyPatternConfig()]);
    };

    const configIsValid = (config: PatternConfig): boolean => {
        return Boolean(config.processUUID) && config.eventIndex !== null && config.lockedFields.length > 0;
    };

    const buildGroupFromConfigs = (): PatternGroup | null => {
        const patterns: EventPattern[] = [];

        for (const config of patternConfigs) {
            const pattern = buildEventPattern(config, events);
            if (!pattern) {
                return null;
            }
            patterns.push(pattern);
        }

        const name = patternName.trim() || `Pattern group ${createdGroups.length + 1}`;
        return new PatternGroup(patterns, name);
    };

    const createPatternGroup = () => {
        const group = buildGroupFromConfigs();
        if (!group) {
            return;
        }

        setCreatedGroups((prev) => [...prev, group]);
        resetForm();
    };

    const canCreateGroup = useMemo(
        () =>
            patternConfigs.length > 0 &&
            patternConfigs.every((config) => configIsValid(config)) &&
            Boolean(patternName.trim()),
        [patternConfigs, patternName]
    );

    if (!executionTrace) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <p className="text-gray-600">No execution trace available.</p>
            </div>
        );
    }

    return (
        <>
            <Title content={"Causality"} />
            <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
                <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold">Create pattern group</h2>
                        <p className="text-sm text-gray-600">
                            Select a process, choose a reference event, and lock the fields that should be matched. The
                            view displays how many events currently match each pattern.
                        </p>
                    </div>

                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Pattern group name
                        <input
                            type="text"
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                            value={patternName}
                            onChange={(event) => setPatternName(event.target.value)}
                            placeholder="Short description"
                        />
                    </label>

                    <div className="flex flex-col gap-4">
                        {patternConfigs.map((config, index) => (
                            <PatternConfigurator
                                key={config.id}
                                index={index}
                                config={config}
                                processes={processes}
                                availableEvents={availableEventsForProcess(config.processUUID)}
                                selectedEvent={getEventByIndex(config.eventIndex)}
                                onProcessChange={handleProcessChange}
                                onEventChange={handleEventChange}
                                onToggleField={handleToggleField}
                                onRemove={removePatternConfig}
                                lockedFields={config.lockedFields}
                                matchesCount={computeMatches(config)}
                                disableRemove={patternConfigs.length === 1}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={addPatternConfig}
                            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        >
                            Add event pattern
                        </button>
                        <button
                            type="button"
                            onClick={createPatternGroup}
                            disabled={!canCreateGroup}
                            className={`rounded px-4 py-2 text-sm font-medium ${
                                canCreateGroup
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            Create pattern group
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-lg bg-white p-4 shadow">
                    <h2 className="mb-3 text-xl font-semibold">Created pattern groups</h2>
                    {createdGroups.length === 0 && (
                        <p className="text-sm text-gray-600">No pattern groups created yet.</p>
                    )}
                    {createdGroups.length > 0 && (
                        <ul className="space-y-3">
                            {createdGroups.map((group, index) => (
                                <li key={`${group.name}-${index}`} className="rounded border border-gray-200 p-3">
                                    <p className="font-semibold">{group.name}</p>
                                    <p className="text-sm text-gray-600">{group.patterns.length} event pattern(s)</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};


export default CausalityView;