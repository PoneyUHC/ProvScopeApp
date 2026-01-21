// EventPatternBuilderView.tsx
import { useContext, useMemo, useState } from "react";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";
import { ExecutionTraceContext, ExecutionTraceContextType } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";

type NamedEventPattern = {
    id: string;
    name: string;
    pattern: EventPattern;
};

type Props = {
    initialCode?: string;
    initialName?: string;

    /** Optional callback when the list changes. */
    onChange?: (patterns: NamedEventPattern[]) => void;
};

function createId(): string {
    // good enough for UI keys; swap to crypto.randomUUID() if you prefer
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function EventPatternBuilderView({
    initialCode,
    initialName,
    onChange,
}: Props) {
    const [nameInput, setNameInput] = useState(initialName ?? "MyPattern");
    const [codeInput, setCodeInput] = useState(
        initialCode ??
        `({
  type: "OpenEvent",
  "meta.user.id": "u1",
})`
    );

    const {
        executionTrace: executionTrace,
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    if (!executionTrace) {
        return null;
    }

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [patterns, setPatterns] = useState<NamedEventPattern[]>([]);

    const evaluateToRecord = (code: string): Record<string, unknown> => {
        // ⚠️ Only safe for trusted/dev tooling
        const evaluatedValue = new Function(`"use strict"; return (${code});`)();

        if (evaluatedValue === null || typeof evaluatedValue !== "object" || Array.isArray(evaluatedValue)) {
            throw new Error("Code must evaluate to an object (Record<string, unknown>).");
        }

        return evaluatedValue as Record<string, unknown>;
    };

    const addPattern = () => {
        try {
            const trimmedName = nameInput.trim();
            if (!trimmedName) throw new Error("Name cannot be empty.");

            const record = evaluateToRecord(codeInput);
            const createdPattern = new EventPattern(record);

            const newEntry: NamedEventPattern = {
                id: createId(),
                name: trimmedName,
                pattern: createdPattern,
            };

            setPatterns((previous) => {
                const next = [newEntry, ...previous];
                onChange?.(next);
                return next;
            });

            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : String(error));
        }
    };

    const removePattern = (patternId: string) => {
        setPatterns((previous) => {
            const next = previous.filter((entry) => entry.id !== patternId);
            onChange?.(next);
            return next;
        });
    };

    const matchCountsById = useMemo(() => {
        const events = executionTrace.events
        const counts = new Map<string, number>();
        if (events.length === 0) return counts;

        for (const entry of patterns) {
            let matchingEventsCount = 0;
            for (const candidateEvent of events) {
                const matchResult = entry.pattern.matches(candidateEvent as any);
                if (matchResult === true) matchingEventsCount += 1;
            }
            counts.set(entry.id, matchingEventsCount);
        }
        return counts;
    }, [patterns, executionTrace]);

    return (
        <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">EventPatterns</div>

                <button
                    onClick={addPattern}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                >
                    Add
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <input
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    placeholder="Pattern name"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />

                <div className="text-xs text-slate-500 md:text-right">
                    Tip: wrap object literals in parentheses:{" "}
                    <span className="font-mono">({"{"} ... {"}"})</span>
                </div>
            </div>

            <textarea
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                spellCheck={false}
                className="h-44 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-slate-400"
            />

            {errorMessage && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-3">
                {patterns.length === 0 ? (
                    <div className="text-sm text-slate-600">No patterns yet.</div>
                ) : (
                    patterns.map((entry) => {
                        const matchingEventsCount = matchCountsById.get(entry.id) ?? 0;
                        return (
                            <div
                                key={entry.id}
                                className="relative rounded-md border border-slate-200 bg-white p-3"
                            >
                                <button
                                    onClick={() => removePattern(entry.id)}
                                    className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    aria-label={`Remove pattern ${entry.name}`}
                                    title="Remove"
                                >
                                    ✕
                                </button>

                                <div className="flex items-center justify-between gap-3 pr-8">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{entry.name}</div>
                                        <div className="text-xs text-slate-600">
                                            Matches:{" "}
                                            <span className="font-semibold text-slate-900">
                                                {matchingEventsCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                                    {JSON.stringify(entry.pattern.pattern, null, 2)}
                                </pre>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
