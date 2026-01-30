// CausalPropertyPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { NamedEventPattern } from "@renderer/components/Causality/EventPatternPanel";

export type DependencyMode = "dependent" | "independent";

export type NamedCausalProperty = {
  id: string;
  name: string;

  dependencyMode: DependencyMode;

  sourcePatternId: string;
  targetPatternId: string;

  predicateCode: string;
  predicate: (sourceEvent: unknown, targetEvent: unknown) => boolean;
};

export type CausalPropertyPanelProps = {
  initialCode?: string;
  initialName?: string;

  eventPatterns: NamedEventPattern[];

  properties: NamedCausalProperty[];
  onChange: (properties: NamedCausalProperty[]) => void;
};

const createId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const compilePredicate = (predicateCode: string): NamedCausalProperty["predicate"] => {
  // ⚠️ Only safe for trusted/dev tooling
  let compiledFunction: (sourceEvent: unknown, targetEvent: unknown) => unknown;

  try {
    compiledFunction = new Function(
      "sourceEvent",
      "targetEvent",
      `"use strict"; return (${predicateCode});`
    ) as any;
  } catch {
    compiledFunction = new Function(
      "sourceEvent",
      "targetEvent",
      `"use strict"; ${predicateCode}`
    ) as any;
  }

  return (sourceEvent, targetEvent) => {
    const result = compiledFunction(sourceEvent, targetEvent);
    if (typeof result !== "boolean") {
      throw new Error("Alignement property code must evaluate to a boolean.");
    }
    return result;
  };
};

const insertTwoSpacesOnTab = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  setValue: (updater: (previous: string) => string) => void
) => {
  if (event.key !== "Tab") return;

  event.preventDefault();

  const textAreaElement = event.currentTarget;
  const selectionStartIndex = textAreaElement.selectionStart ?? 0;
  const selectionEndIndex = textAreaElement.selectionEnd ?? 0;

  const insertedText = "  ";
  const nextCursorIndex = selectionStartIndex + insertedText.length;

  setValue((previousText) => {
    const beforeSelection = previousText.slice(0, selectionStartIndex);
    const afterSelection = previousText.slice(selectionEndIndex);
    return `${beforeSelection}${insertedText}${afterSelection}`;
  });

  requestAnimationFrame(() => {
    textAreaElement.setSelectionRange(nextCursorIndex, nextCursorIndex);
  });
};

export const CausalPropertyPanel = ({
  initialCode,
  initialName,
  eventPatterns,
  properties,
  onChange,
}: CausalPropertyPanelProps) => {
  const [nameInput, setNameInput] = useState(initialName ?? "MyProperty");
  const [dependencyMode, setDependencyMode] = useState<DependencyMode>("dependent");

  const [predicateCodeInput, setPredicateCodeInput] = useState(
    initialCode ?? `sourceEvent.pid === targetEvent.pid`
  );

  const [selectedSourcePatternId, setSelectedSourcePatternId] = useState<string>(
    eventPatterns[0]?.id ?? ""
  );
  const [selectedTargetPatternId, setSelectedTargetPatternId] = useState<string>(
    eventPatterns[0]?.id ?? ""
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSourcePatternId && eventPatterns[0]?.id) setSelectedSourcePatternId(eventPatterns[0].id);
    if (!selectedTargetPatternId && eventPatterns[0]?.id) setSelectedTargetPatternId(eventPatterns[0].id);
  }, [eventPatterns, selectedSourcePatternId, selectedTargetPatternId]);

  const eventPatternNameById = useMemo(() => {
    const mapping = new Map<string, string>();
    for (const eventPattern of eventPatterns) mapping.set(eventPattern.id, eventPattern.name);
    return mapping;
  }, [eventPatterns]);

  const addProperty = () => {
    try {
      const trimmedName = nameInput.trim();
      if (!trimmedName) throw new Error("Name cannot be empty.");

      const nameAlreadyExists = properties.some(
        (existingProperty) => existingProperty.name === trimmedName
      );
      if (nameAlreadyExists) {
        throw new Error(`A CausalProperty named "${trimmedName}" already exists.`);
      }

      // Even for "independent", keep the selected patterns so the UI can display them.
      if (eventPatterns.length > 0) {
        if (!selectedSourcePatternId) throw new Error("Select a source EventPattern.");
        if (!selectedTargetPatternId) throw new Error("Select a target EventPattern.");
        if (!eventPatternNameById.has(selectedSourcePatternId)) {
          throw new Error("Selected source EventPattern does not exist anymore.");
        }
        if (!eventPatternNameById.has(selectedTargetPatternId)) {
          throw new Error("Selected target EventPattern does not exist anymore.");
        }
      }

      const compiledPredicate = compilePredicate(predicateCodeInput);

      const newEntry: NamedCausalProperty = {
        id: createId(),
        name: trimmedName,
        dependencyMode,
        sourcePatternId: selectedSourcePatternId,
        targetPatternId: selectedTargetPatternId,
        predicateCode: predicateCodeInput,
        predicate: compiledPredicate,
      };

      onChange([newEntry, ...properties]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const removeProperty = (propertyId: string) => {
    onChange(properties.filter((entry) => entry.id !== propertyId));
  };

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">CausalPropertyPanel</div>

        <button
          onClick={addProperty}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
        >
          Add
        </button>
      </div>

      <input
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        placeholder="Property name"
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={selectedSourcePatternId}
          onChange={(event) => setSelectedSourcePatternId(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          disabled={eventPatterns.length === 0 || dependencyMode === "independent"}
        >
          {eventPatterns.length === 0 ? (
            <option value="">No EventPatterns</option>
          ) : (
            eventPatterns.map((eventPattern) => (
              <option key={eventPattern.id} value={eventPattern.id}>
                Source: {eventPattern.name}
              </option>
            ))
          )}
        </select>

        <select
          value={selectedTargetPatternId}
          onChange={(event) => setSelectedTargetPatternId(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          disabled={eventPatterns.length === 0 || dependencyMode === "independent"}
        >
          {eventPatterns.length === 0 ? (
            <option value="">No EventPatterns</option>
          ) : (
            eventPatterns.map((eventPattern) => (
              <option key={eventPattern.id} value={eventPattern.id}>
                Target: {eventPattern.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-600">Mode</div>

        <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => setDependencyMode("dependent")}
            className={[
              "px-3 py-1.5 text-sm",
              dependencyMode === "dependent"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            Dependent
          </button>
          <button
            type="button"
            onClick={() => setDependencyMode("independent")}
            className={[
              "px-3 py-1.5 text-sm",
              dependencyMode === "independent"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            Independent
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-600">Alignement property</div>

      <textarea
        value={predicateCodeInput}
        onChange={(event) => setPredicateCodeInput(event.target.value)}
        onKeyDown={(event) => insertTwoSpacesOnTab(event, setPredicateCodeInput)}
        spellCheck={false}
        placeholder={`Example:\nsourceEvent.pid === targetEvent.pid`}
        className="h-40 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-slate-400"
      />

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {properties.length === 0 ? (
          <div className="text-sm text-slate-600">No properties yet.</div>
        ) : (
          properties.map((entry) => {
            const sourceName = eventPatternNameById.get(entry.sourcePatternId) ?? "—";
            const targetName = eventPatternNameById.get(entry.targetPatternId) ?? "—";

            const modeLabel = entry.dependencyMode === "dependent" ? "Dependent" : "Independent";
            const modeBadgeClass =
              entry.dependencyMode === "dependent"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white";

            return (
              <div key={entry.id} className="relative rounded-md border border-slate-200 bg-white p-3">
                <button
                  onClick={() => removeProperty(entry.id)}
                  className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Remove property ${entry.name}`}
                  title="Remove"
                >
                  ✕
                </button>

                <div className="pr-8">
                  <div className="truncate text-sm font-semibold">{entry.name}</div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className={`rounded px-2 py-0.5 font-semibold ${modeBadgeClass}`}>
                      {modeLabel}
                    </span>

                    <span>
                      {`source : ${sourceName} | destination : ${targetName}`}
                    </span>
                  </div>
                </div>

                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {entry.predicateCode}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CausalPropertyPanel;
