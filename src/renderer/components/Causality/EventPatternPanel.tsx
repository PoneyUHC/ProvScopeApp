

import React, { useContext, useMemo, useState } from "react";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";
import {
  ExecutionTraceContext,
  ExecutionTraceContextType,
} from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";


export interface EventPatternPanelProps {
  initialCode?: string;
  initialName?: string;
  patterns: EventPattern[];
  onChange: (patterns: EventPattern[]) => void;
}


const evaluateToObject = (code: string): unknown => {
  // ⚠️ Only safe for trusted/dev tooling
  return new Function(`"use strict"; return (${code});`)();
};


export const EventPatternPanel: React.FC<EventPatternPanelProps> = ({
  initialCode,
  initialName,
  patterns,
  onChange,
}) => {
  const { executionTrace } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

  const [nameInput, setNameInput] = useState(initialName ?? "MyPattern");
  const [codeInput, setCodeInput] = useState(
    initialCode ??
      `({
  eventType: "OpenEvent",
})`
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCodeTextAreaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;

    event.preventDefault();

    const textAreaElement = event.currentTarget;
    const selectionStartIndex = textAreaElement.selectionStart ?? 0;
    const selectionEndIndex = textAreaElement.selectionEnd ?? 0;

    const insertedText = "  ";
    const nextCursorIndex = selectionStartIndex + insertedText.length;

    setCodeInput((previousText) => {
      const beforeSelection = previousText.slice(0, selectionStartIndex);
      const afterSelection = previousText.slice(selectionEndIndex);
      return `${beforeSelection}${insertedText}${afterSelection}`;
    });

    requestAnimationFrame(() => {
      textAreaElement.setSelectionRange(nextCursorIndex, nextCursorIndex);
    });
  };

  const addPattern = () => {
    try {
      if (!executionTrace) return;

      const trimmedName = nameInput.trim();
      if (!trimmedName) throw new Error("Name cannot be empty.");

      const nameAlreadyExists = patterns.some((existingPattern) => existingPattern.name === trimmedName);
      if (nameAlreadyExists) {
        throw new Error(`An EventPattern named "${trimmedName}" already exists.`);
      }

      const evaluatedValue = evaluateToObject(codeInput);
      if (evaluatedValue === null || typeof evaluatedValue !== "object" || Array.isArray(evaluatedValue)) {
        throw new Error("Code must evaluate to an object (Record<string, unknown>).");
      }

      const createdPattern = new EventPattern(trimmedName, evaluatedValue as Record<string, unknown>);
      onChange([createdPattern, ...patterns]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const removePattern = (patternName: string) => {
    onChange(patterns.filter((eventPattern) => eventPattern.name !== patternName));
  };

  const matchCountsByName = useMemo(() => {
    const counts = new Map<string, number>();
    const events = executionTrace?.events ?? [];
    if (events.length === 0) return counts;

    for (const eventPattern of patterns) {
      let matchingEventsCount = 0;
      for (const candidateEvent of events) {
        const matchResult = eventPattern.matches(candidateEvent as any);
        if (matchResult === true) matchingEventsCount += 1;
      }
      counts.set(eventPattern.name, matchingEventsCount);
    }
    return counts;
  }, [patterns, executionTrace]);

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">EventPatternPanel</div>

        <button
          onClick={addPattern}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
        >
          Add
        </button>
      </div>

      <input
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        placeholder="Pattern name"
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
      />

      <textarea
        value={codeInput}
        onChange={(event) => setCodeInput(event.target.value)}
        onKeyDown={handleCodeTextAreaKeyDown}
        spellCheck={false}
        className="h-40 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-slate-400"
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
          patterns.map((eventPattern) => {
            const matchingEventsCount = matchCountsByName.get(eventPattern.name) ?? 0;
            return (
              <div key={eventPattern.name} className="relative rounded-md border border-slate-200 bg-white p-3">
                <button
                  onClick={() => removePattern(eventPattern.name)}
                  className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Remove pattern ${eventPattern.name}`}
                  title="Remove"
                >
                  ✕
                </button>

                <div className="pr-8">
                  <div className="truncate text-sm font-semibold">{eventPattern.name}</div>
                  <div className="text-xs text-slate-600">
                    Matches: <span className="font-semibold text-slate-900">{matchingEventsCount}</span>
                  </div>
                </div>

                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {JSON.stringify(eventPattern.pattern, null, 2)}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventPatternPanel;
