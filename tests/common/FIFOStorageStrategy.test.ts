import { describe, it, expect, vi, beforeEach } from "vitest";

// Adjust these imports to your actual paths/aliases
import FIFOStorageStrategy from "@common/Provenance/InterProcess/StorageStrategy/FIFOStorageStrategy";
import DataChunk from "@common/Provenance/InterProcess/DataChunk";

type TestEvent = {
  eventType: string;
  inputValues: Record<string, unknown>;
  outputValues: Record<string, unknown>;
};

function ev(
  eventType: string,
  inputValues: Record<string, unknown> = {},
  outputValues: Record<string, unknown> = {}
): TestEvent {
  return { eventType, inputValues, outputValues };
}

function mkChunk(data: string, origin: TestEvent = ev("WriteEvent")): DataChunk {
  // Matches your FIFOStorageStrategy usage: new DataChunk(data, event)
  return new DataChunk(data, origin as any);
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
    expect(content(resOpen)).toBe("abcdef");
  });

  it("applyWriteEvent appends a chunk truncated to ret", () => {
    const strat = new FIFOStorageStrategy();
    const initial = [mkChunk("hello")];

    const e = ev(
      "WriteEvent",
      { content: "WORLD!!" },
      { ret: 5 } // only "WORLD"
    );

    const res = strat.applyWriteEvent(e as any, initial);

    // original array should not be mutated (new array returned)
    expect(res).not.toBe(initial);
    expect(content(initial)).toBe("hello");

    expect(content(res)).toBe("helloWORLD");
    expect(res[res.length - 1].data).toBe("WORLD");
    expect(res[res.length - 1].size).toBe(5);
  });

  it("applyEvent(WriteEvent) uses the write applier (appends)", () => {
    const strat = new FIFOStorageStrategy();
    const initial = [mkChunk("a")];

    const e = ev("WriteEvent", { content: "bbb" }, { ret: 2 }); // "bb"
    const res = strat.applyEvent(e as any, initial);

    expect(content(res)).toBe("abb");
  });

  it("internalGetContent(shouldModify=true) consumes from the head (FIFO) and returns the extracted chunks", () => {
    const strat = new FIFOStorageStrategy();
    const eRead = ev("ExitReadEvent", {}, { ret: 5 });

    const current = [mkChunk("abc"), mkChunk("defg")]; // total 7
    const extracted = strat.internalGetContent(eRead as any, current, true);

    expect(extracted.map((c) => c.data)).toEqual(["abc", "de"]);
    expect(content(extracted)).toBe("abcde");

    // should have consumed 5 bytes => remaining is "fg"
    expect(content(current)).toBe("fg");
    expect(current.length).toBe(1);
    expect(current[0].data).toBe("fg");
  });

  it("internalGetContent returns [] and logs error if ret > available", () => {
    const strat = new FIFOStorageStrategy();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const eRead = ev("ExitReadEvent", {}, { ret: 100 });
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
    const eRead = ev("ExitReadEvent", {}, { ret: 4 });

    const current = [mkChunk("abc"), mkChunk("defg")];
    const before = content(current);

    const extracted = strat.getContent(eRead as any, current);

    expect(content(extracted)).toBe("abcd");
    expect(content(current)).toBe(before); // should be unchanged
  });

  it("applyEvent(ExitReadEvent) should return the updated remaining FIFO content", () => {
    const strat = new FIFOStorageStrategy();
    const current = [mkChunk("abc"), mkChunk("defg")];

    // consume 5 bytes => remaining "fg"
    const eRead = ev("ExitReadEvent", {}, { ret: 5 });

    const res = strat.applyEvent(eRead as any, current);

    // applyEvent should yield the new storage state (remaining content)
    expect(content(res)).toBe("fg");
  });

  it("applyExitReadEvent should remove bytes and return remaining storage state", () => {
    const strat = new FIFOStorageStrategy();
    const current = [mkChunk("hello"), mkChunk("world")];

    const eRead = ev("ExitReadEvent", {}, { ret: 7 }); // consume "hellowo"
    const res = strat.applyExitReadEvent(eRead as any, current);

    // remaining should be "rld"
    expect(content(res)).toBe("rld");
  });

  it("unknown eventType logs error and leaves content unchanged", () => {
    const strat = new FIFOStorageStrategy();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const current = [mkChunk("abc")];
    const res = strat.applyEvent(ev("Nope") as any, current);

    expect(res).toBe(current);
    expect(content(res)).toBe("abc");
    expect(spy).toHaveBeenCalled();
  });
});