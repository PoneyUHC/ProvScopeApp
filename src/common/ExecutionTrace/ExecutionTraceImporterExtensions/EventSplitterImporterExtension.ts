import { ExecutionTrace } from "../ExecutionTrace";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";

import { Event } from "@common/types";

export default class EventSplitterImporterExtension implements ExecutionTraceImporterExtension {

    static getTag(): string | null {
        return null;
    }

    importData(executionTrace: ExecutionTrace, _json: JSON, _extensionData: JSON): boolean {
        console.log(`Executing ${EventSplitterImporterExtension.name}`);

        const events = executionTrace.events;
        const newEvents: Event[] = [];

        for (const event of events) {

            // Only split WriteEvents coming from log_collector
            if (!shouldSplit(event)) {
                newEvents.push(event);
                continue;
            }

            const contentHex = String(event.outputValues["content"] ?? "");
            if (contentHex.length === 0) {
                newEvents.push(event);
                continue;
            }

            // Split into messages *including* their trailing newline byte (0a).
            // If the original content ends with 0a, the last split event also ends with 0a.
            const parts = splitHexMessagesWithTrailingNewline(contentHex);

            if (parts.length <= 1) {
                newEvents.push(event);
                continue;
            }

            for (const partHex of parts) {
                if (partHex.length === 0) {
                    continue;
                }

                const sizeBytes = Math.floor(partHex.length / 2);

                let description = event.description;
                if (!description.startsWith("[SPLIT]")) {
                    description = "[SPLIT] " + description;
                }

                const splitEvent = new Event(
                    event.timestamp,
                    event.process,
                    event.eventType,
                    event.otherEntities,
                    event.sourceEntities,
                    event.targetEntities,
                    { ...event.inputValues, size: sizeBytes },
                    { ...event.outputValues, ret: sizeBytes, content: partHex },
                    description
                );

                splitEvent.color = event.color;
                newEvents.push(splitEvent);
            }
        }

        executionTrace.events = newEvents;
        return true;
    }
}

function shouldSplit(event: Event): boolean {
    if (event.eventType !== "WriteEvent") {
        return false;
    }

    return (
        typeof event.process?.name === "string" &&
        event.process.name.includes("log_colle") &&
        ! event.description.startsWith("[MERGED]") 
    );
}

/**
 * The content is expected to be: (message + "\n") repeated N times.
 * We therefore split on newline byte (0a) and we KEEP the newline byte
 * as part of each returned chunk.
 *
 * If the original content ends with 0a (as expected), the last chunk ends with 0a too.
 * If the original content does NOT end with 0a, the trailing partial message is discarded,
 * because it violates the expected (message + "\n") pattern.
 */
function splitHexMessagesWithTrailingNewline(hex: string): string[] {
    const h = hex.toLowerCase();
    const parts: string[] = [];

    let start = 0;

    // Scan by bytes (2 hex chars)
    for (let i = 0; i + 2 <= h.length; i += 2) {
        if (h.slice(i, i + 2) !== "0a") {
            continue;
        }

        const end = i + 2; // include "0a"
        parts.push(h.slice(start, end));
        start = end;
    }

    // Enforce the expected pattern: only keep full (message + "\n") chunks.
    // So if there's leftover after the last "0a", we drop it.
    // (If you prefer to keep it as its own event, remove this block.)
    if (start !== h.length) {
        // leftover exists -> discard it
    }

    return parts;
}
