// tests/common/FIFOStorageStrategy.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

import FIFOStorageStrategy from "@common/Provenance/InterProcess/StorageStrategy/FIFOStorageStrategy";
import DataChunk from "@common/Provenance/InterProcess/DataChunk";

type TestEvent = {
    eventType: string;
    outputValues: Record<string, unknown>;
};

function ev(eventType: string, outputValues: Record<string, unknown> = {}): TestEvent {
    return { eventType, outputValues };
}

function toHex(text: string): string {
    return Array.from(text)
        .map((character) => character.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");
}

function mkChunk(data: string, origin: TestEvent = ev("WriteEvent")): DataChunk {
    // Store hex-encoded content inside DataChunk
    return new DataChunk(toHex(data), origin as any);
}

function content(chunks: DataChunk[]): string {
    return chunks.map((chunk) => chunk.data).join("");
}

function snapshotData(chunks: DataChunk[]): string[] {
    return chunks.map((chunk) => chunk.data);
}

describe("FIFOStorageStrategy", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("clone() returns a new independent strategy", () => {
        const strategy1 = new FIFOStorageStrategy();
        const strategy2 = strategy1.clone();

        expect(strategy2).toBeInstanceOf(FIFOStorageStrategy);
        expect(strategy2).not.toBe(strategy1);
    });

    it("applyEvent(OpenEvent/CloseEvent) is a no-op on content", () => {
        const strategy = new FIFOStorageStrategy();
        const initial = [mkChunk("abc"), mkChunk("def")];

        const openResult = strategy.applyEvent(ev("OpenEvent") as any, initial);
        const closeResult = strategy.applyEvent(ev("CloseEvent") as any, initial);

        expect(openResult).toBe(initial); // implementation returns c directly
        expect(closeResult).toBe(initial); // implementation returns c directly
        expect(content(openResult)).toBe(toHex("abcdef"));
    });

    it("applyWriteEvent appends a chunk truncated to ret (ret is bytes)", () => {
        const strategy = new FIFOStorageStrategy();
        const initial = [mkChunk("hello")];

        // requestedWriteContent is hex string; ret is number of BYTES written
        const writeEvent = ev("WriteEvent", { content: toHex("WORLD!!"), ret: 5 }); // "WORLD" (5 bytes)

        const result = strategy.applyWriteEvent(writeEvent as any, initial);

        // original array should not be mutated (new array returned)
        expect(result).not.toBe(initial);
        expect(content(initial)).toBe(toHex("hello"));

        expect(content(result)).toBe(toHex("helloWORLD"));
        expect(result[result.length - 1].data).toBe(toHex("WORLD"));
        expect(result[result.length - 1].size).toBe(5);
    });

    it("applyEvent(WriteEvent) uses the write applier (appends)", () => {
        const strategy = new FIFOStorageStrategy();
        const initial = [mkChunk("a")];

        // ret is BYTES => 2 bytes means "bb"
        const writeEvent = ev("WriteEvent", { content: toHex("bbb"), ret: 2 });

        const result = strategy.applyEvent(writeEvent as any, initial);

        expect(content(result)).toBe(toHex("abb"));
    });

    it("internalGetContent(shouldModify=true) consumes from the head (FIFO) and returns the extracted chunks", () => {
        const strategy = new FIFOStorageStrategy();
        const readEvent = ev("ExitReadEvent", { ret: 5 });

        const current = [mkChunk("abc"), mkChunk("defg")]; // total 7 bytes
        const extracted = strategy.internalGetContent(readEvent as any, current, true);

        expect(extracted.map((chunk) => chunk.data)).toEqual([toHex("abc"), toHex("de")]);
        expect(content(extracted)).toBe(toHex("abcde"));

        // should have consumed 5 bytes => remaining is "fg"
        expect(content(current)).toBe(toHex("fg"));
        expect(current.length).toBe(1);
        expect(current[0].data).toBe(toHex("fg"));
    });

    it("internalGetContent returns [] and logs error if ret > available", () => {
        const strategy = new FIFOStorageStrategy();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});

        const readEvent = ev("ExitReadEvent", { ret: 100 });
        const current = [mkChunk("abc"), mkChunk("def")];
        const snapshot = snapshotData(current);

        const extracted = strategy.internalGetContent(readEvent as any, current, true);

        expect(extracted).toEqual([]);
        expect(spy).toHaveBeenCalled();

        // should not modify content on error
        expect(snapshotData(current)).toEqual(snapshot);
        expect(current.length).toBe(snapshot.length);
    });

    it("getContent should NOT modify currentContent (peek semantics)", () => {
        const strategy = new FIFOStorageStrategy();
        const readEvent = ev("ExitReadEvent", { ret: 4 });

        const current = [mkChunk("abc"), mkChunk("defg")];
        const beforeSnapshot = snapshotData(current);

        const extracted = strategy.getContent(readEvent as any, current);

        expect(content(extracted)).toBe(toHex("abcd"));
        expect(snapshotData(current)).toEqual(beforeSnapshot);
    });

    it("applyEvent(ExitReadEvent) should return the updated remaining FIFO content", () => {
        const strategy = new FIFOStorageStrategy();
        const current = [mkChunk("abc"), mkChunk("defg")];

        // consume 5 bytes => remaining "fg"
        const readEvent = ev("ExitReadEvent", { ret: 5 });

        const result = strategy.applyEvent(readEvent as any, current);

        // applyEvent yields the same mutated array instance (implementation returns currentContent)
        expect(result).toBe(current);
        expect(content(result)).toBe(toHex("fg"));
    });

    it("applyExitReadEvent should remove bytes and return remaining storage state", () => {
        const strategy = new FIFOStorageStrategy();
        const current = [mkChunk("hello"), mkChunk("world")];

        const readEvent = ev("ExitReadEvent", { ret: 7 }); // consume "hellowo"
        const result = strategy.applyExitReadEvent(readEvent as any, current);

        // remaining should be "rld"
        expect(content(result)).toBe(toHex("rld"));
    });

    it("unknown eventType logs error and leaves content unchanged", () => {
        const strategy = new FIFOStorageStrategy();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});

        const current = [mkChunk("abc")];
        const result = strategy.applyEvent(ev("Nope") as any, current);

        expect(result).toBe(current);
        expect(content(result)).toBe(toHex("abc"));
        expect(spy).toHaveBeenCalled();
    });
});
