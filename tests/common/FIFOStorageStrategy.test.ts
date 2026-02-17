import { describe, it, expect, vi, beforeEach } from "vitest";

// Adjust these imports to your actual paths/aliases
import FIFOStorageStrategy from "@common/Provenance/InterProcess/StorageStrategy/FIFOStorageStrategy";
import DataChunk from "@common/Provenance/InterProcess/DataChunk";

type TestEvent = {
  eventType: string;
  outputValues: Record<string, unknown>;
};

function ev(
  eventType: string,
  outputValues: Record<string, unknown> = {}
): TestEvent {
  return { eventType, outputValues };
}

function toHex(s: string): string {
  return Array.from(s).map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function maybeDecodeData(data: string): string {
  if (/^[0-9a-fA-F]*$/.test(data) && data.length % 2 === 0) {
    let out = "";
    for (let i = 0; i < data.length; i += 2) {
      out += String.fromCharCode(parseInt(data.slice(i, i + 2), 16));
    }
    return out;
  }
  return data;
}

function mkChunk(data: string, origin: TestEvent = ev("WriteEvent")): DataChunk {
  // store hex-encoded content inside DataChunk
  return new DataChunk(toHex(data), origin as any);
}

function content(chunks: DataChunk[]): string {
  return chunks.map((c) => c.data).join("");
}

function cloneChunks(chunks: DataChunk[]): DataChunk[] {
  // deep-ish copy for mutation detection
  return chunks.map((c) => c.clone());
}

describe("FIFOStorageStrategy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("clone() returns a new independent strategy", () => {
    const s1 = new FIFOStorageStrategy();
    const s2 = s1.clone();

    expect(s2).toBeInstanceOf(FIFOStorageStrategy);
    expect(s2).not.toBe(s1);
  });

  it("applyEvent(OpenEvent/CloseEvent) is a no-op on content", () => {
    const strat = new FIFOStorageStrategy();
    const initial = [mkChunk("abc"), mkChunk("def")];

    const resOpen = strat.applyEvent(ev("OpenEvent") as any, initial);
    const resClose = strat.applyEvent(ev("CloseEvent") as any, initial);

    expect(resOpen).toBe(initial);   // code returns c directly
    expect(resClose).toBe(initial);  // code returns c directly
    expect(content(resOpen)).toBe(toHex("abcdef"));
  });

  it("applyWriteEvent appends a chunk truncated to ret", () => {
    const strat = new FIFOStorageStrategy();
    const initial = [mkChunk("hello")];

    const e = ev(
      "WriteEvent",
      { content: toHex("WORLD!!"), ret: 10 } // only "WORLD" (ret in hex-chars)
    );

    const res = strat.applyWriteEvent(e as any, initial);

    // original array should not be mutated (new array returned)
    expect(res).not.toBe(initial);
    expect(content(initial)).toBe(toHex("hello"));

    expect(content(res)).toBe(toHex("helloWORLD"));
    expect(res[res.length - 1].data).toBe(toHex("WORLD"));
    expect(res[res.length - 1].size).toBe(5);
  });

  it("applyEvent(WriteEvent) uses the write applier (appends)", () => {
    const strat = new FIFOStorageStrategy();
    const initial = [mkChunk("a")];

    const e = ev("WriteEvent", { content: toHex("bbb"), ret: 4 }); // "bb" (ret in hex-chars)
    const res = strat.applyEvent(e as any, initial);

    expect(content(res)).toBe(toHex("abb"));
  });

  it("internalGetContent(shouldModify=true) consumes from the head (FIFO) and returns the extracted chunks", () => {
    const strat = new FIFOStorageStrategy();
    const eRead = ev("ExitReadEvent", { ret: 5 });

    const current = [mkChunk("abc"), mkChunk("defg")]; // total 7
    const extracted = strat.internalGetContent(eRead as any, current, true);

    expect(extracted.map((c) => c.data)).toEqual([toHex("abc"), toHex("de")]);
    expect(content(extracted)).toBe(toHex("abcde"));

    // should have consumed 5 bytes => remaining is "fg"
    expect(content(current)).toBe(toHex("fg"));
    expect(current.length).toBe(1);
    expect(current[0].data).toBe(toHex("fg"));
  });

  it("internalGetContent returns [] and logs error if ret > available", () => {
    const strat = new FIFOStorageStrategy();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const eRead = ev("ExitReadEvent", { ret: 100 });
    const current = [mkChunk("abc"), mkChunk("def")];
    const snapshot = cloneChunks(current);

    const extracted = strat.internalGetContent(eRead as any, current, true);

    expect(extracted).toEqual([]);
    expect(spy).toHaveBeenCalled();

    // should not modify content on error
    expect(content(current)).toBe(content(snapshot));
    expect(current.length).toBe(snapshot.length);
  });

  it("getContent should NOT modify currentContent (peek semantics)", () => {
    const strat = new FIFOStorageStrategy();
    const eRead = ev("ExitReadEvent", { ret: 4 });

    const current = [mkChunk("abc"), mkChunk("defg")];
    const before = content(current);

    const extracted = strat.getContent(eRead as any, current);

    expect(content(extracted)).toBe(toHex("abcd"));
    expect(content(current)).toBe(before); // should be unchanged
  });

  it("applyEvent(ExitReadEvent) should return the updated remaining FIFO content", () => {
    const strat = new FIFOStorageStrategy();
    const current = [mkChunk("abc"), mkChunk("defg")];

    // consume 5 bytes => remaining "fg"
    const eRead = ev("ExitReadEvent", { ret: 5 });

    const res = strat.applyEvent(eRead as any, current);

    // applyEvent should yield the new storage state (remaining content)
    expect(content(res)).toBe(toHex("fg"));
  });

  it("applyExitReadEvent should remove bytes and return remaining storage state", () => {
    const strat = new FIFOStorageStrategy();
    const current = [mkChunk("hello"), mkChunk("world")];

    const eRead = ev("ExitReadEvent", { ret: 7 }); // consume "hellowo"
    const res = strat.applyExitReadEvent(eRead as any, current);

    // remaining should be "rld"
    expect(content(res)).toBe(toHex("rld"));
  });

  it("unknown eventType logs error and leaves content unchanged", () => {
    const strat = new FIFOStorageStrategy();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const current = [mkChunk("abc")];
    const res = strat.applyEvent(ev("Nope") as any, current);

    expect(res).toBe(current);
    expect(content(res)).toBe(toHex("abc"));
    expect(spy).toHaveBeenCalled();
  });
});