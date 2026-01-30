

import React, { useEffect, useMemo, useState } from "react";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";
import { CausalProperty, DependencyMode } from "@common/Provenance/IntraProcess/CausalProperty";


export interface CausalPropertyPanelProps {
  initialCode?: string;
  initialName?: string;

  eventPatterns: EventPattern[];

  properties: CausalProperty[];
  onChange: (properties: CausalProperty[]) => void;
}


const insertTwoSpacesOnTab = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  setValue: React.Dispatch<React.SetStateAction<string>>
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

export const CausalPropertyPanel: React.FC<CausalPropertyPanelProps> = ({
  initialCode,
  initialName,
  eventPatterns,
  properties,
  onChange,
}) => {
  const [nameInput, setNameInput] = useState(initialName ?? "MyProperty");
  const [dependencyMode, setDependencyMode] = useState<DependencyMode>("dependent");

  const [predicateCodeInput, setPredicateCodeInput] = useState(
    initialCode ?? `sourceEvent.pid === targetEvent.pid`
  );

  const patternNames = useMemo(() => eventPatterns.map((pattern) => pattern.name), [eventPatterns]);

  const [selectedSourcePatternName, setSelectedSourcePatternName] = useState<string>(patternNames[0] ?? "");
  const [selectedTargetPatternName, setSelectedTargetPatternName] = useState<string>(patternNames[0] ?? "");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const firstName = patternNames[0] ?? "";

    if (!selectedSourcePatternName || !patternNames.includes(selectedSourcePatternName)) {
      setSelectedSourcePatternName(firstName);
    }
    if (!selectedTargetPatternName || !patternNames.includes(selectedTargetPatternName)) {
      setSelectedTargetPatternName(firstName);
    }
  }, [patternNames, selectedSourcePatternName, selectedTargetPatternName]);

  const addProperty = () => {
    try {
      const trimmedName = nameInput.trim();
      if (!trimmedName) throw new Error("Name cannot be empty.");

      const nameAlreadyExists = properties.some((existingProperty) => existingProperty.name === trimmedName);
      if (nameAlreadyExists) {
        throw new Error(`A CausalProperty named "${trimmedName}" already exists.`);
      }

      if (eventPatterns.length === 0) throw new Error("Create at least one EventPattern first.");
      if (!selectedSourcePatternName) throw new Error("Select a source EventPattern.");
      if (!selectedTargetPatternName) throw new Error("Select a target EventPattern.");

      const sourcePattern = eventPatterns.find((pattern) => pattern.name === selectedSourcePatternName) ?? null;
      const targetPattern = eventPatterns.find((pattern) => pattern.name === selectedTargetPatternName) ?? null;

      if (!sourcePattern) throw new Error("Selected source EventPattern does not exist anymore.");
      if (!targetPattern) throw new Error("Selected target EventPattern does not exist anymore.");

      const createdProperty = new CausalProperty(
        trimmedName,
        dependencyMode,
        sourcePattern,
        targetPattern,
        predicateCodeInput
      );

      onChange([createdProperty, ...properties]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const removeProperty = (propertyName: string) => {
    onChange(properties.filter((property) => property.name !== propertyName));
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
          value={selectedSourcePatternName}
          onChange={(event) => setSelectedSourcePatternName(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          disabled={eventPatterns.length === 0}
        >
          {eventPatterns.length === 0 ? (
            <option value="">No EventPatterns</option>
          ) : (
            eventPatterns.map((eventPattern) => (
              <option key={eventPattern.name} value={eventPattern.name}>
                Source: {eventPattern.name}
              </option>
            ))
          )}
        </select>

        <select
          value={selectedTargetPatternName}
          onChange={(event) => setSelectedTargetPatternName(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          disabled={eventPatterns.length === 0}
        >
          {eventPatterns.length === 0 ? (
            <option value="">No EventPatterns</option>
          ) : (
            eventPatterns.map((eventPattern) => (
              <option key={eventPattern.name} value={eventPattern.name}>
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
          properties.map((property) => {
            const modeLabel = property.dependencyMode === "dependent" ? "Dependent" : "Independent";
            const modeBadgeClass =
              property.dependencyMode === "dependent" ? "bg-emerald-600 text-white" : "bg-red-600 text-white";

            return (
              <div key={property.name} className="relative rounded-md border border-slate-200 bg-white p-3">
                <button
                  onClick={() => removeProperty(property.name)}
                  className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Remove property ${property.name}`}
                  title="Remove"
                >
                  ✕
                </button>

                <div className="pr-8">
                  <div className="truncate text-sm font-semibold">{property.name}</div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className={`rounded px-2 py-0.5 font-semibold ${modeBadgeClass}`}>
                      {modeLabel}
                    </span>

                    <span>{`source : ${property.sourcePattern.name} | destination : ${property.targetPattern.name}`}</span>
                  </div>
                </div>

                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {property.predicateCode}
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
