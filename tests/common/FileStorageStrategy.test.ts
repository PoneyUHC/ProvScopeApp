import { describe, it, expect, vi, beforeEach } from "vitest";

import FileStorageStrategy from "@common/Provenance/InterProcess/StorageStrategy/FileStorageStrategy";
import DataChunk from "@common/Provenance/InterProcess/DataChunk";

type TestProcess = { pid: number; name?: string };
type TestEvent = {
  eventType: string;
  process: TestProcess;
  inputValues: Record<string, any>;
  outputValues: Record<string, any>;
};

const O_APPEND = 0x0400; // 1024
const O_TRUNC  = 0x0200; // 512

function proc(pid: number): TestProcess {
  return { pid };
}

function openEvent(p: TestProcess, fd: number, flags: number): TestEvent {
  return {
    eventType: "OpenEvent",
    process: p,
    inputValues: { flags },
    outputValues: { fd },
  };
}

function closeEvent(p: TestProcess, fd: number): TestEvent {
  return {
    eventType: "CloseEvent",
    process: p,
    inputValues: { fd },
    outputValues: {},
  };
}

function writeEvent(p: TestProcess, fd: number, content: string, ret: number): TestEvent {
  return {
    eventType: "WriteEvent",
    process: p,
    inputValues: { fd },
    outputValues: { content, ret },
  };
}

function exitReadEvent(p: TestProcess, fd: number, ret: number): TestEvent {
  return {
    eventType: "ExitReadEvent",
    process: p,
    inputValues: { fd },
    outputValues: { ret },
  };
}

function toHex(s: string): string {
  return Array.from(s).map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function mkChunk(data: string, origin: TestEvent = openEvent(proc(0), 0, 0)): DataChunk {
  // Your strategy uses: new DataChunk(writtenContent, event)
  // store hex-encoded content inside DataChunk
  return new DataChunk(toHex(data) as any, origin as any);
}

function content(chunks: DataChunk[]): string {
  return chunks.map((c) => c.data).join("");
}

describe("FileStorageStrategy (Linux regular-file semantics)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getKey(process, fd) is stable", () => {
    const s = new FileStorageStrategy();
    expect(s.getKey(proc(42) as any, 3)).toBe("42-3");
    expect(s.getKey(proc(42) as any, 3)).toBe("42-3");
    expect(s.getKey(proc(42) as any, 4)).toBe("42-4");
  });

  it("clone() copies internal maps", () => {
    const s = new FileStorageStrategy();
    const p = proc(1);
    const fd = 7;

    const cur: DataChunk[] = [mkChunk("abc")];
    s.applyOpenEvent(openEvent(p, fd, O_APPEND) as any, cur);

    const key = s.getKey(p as any, fd);

    const cloned = s.clone() as FileStorageStrategy;
    expect(cloned.processCursorPositions.get(key)).toBe(s.processCursorPositions.get(key));
    expect(cloned.doesProcessAppend.get(key)).toBe(s.doesProcessAppend.get(key));
  });

  it("OpenEvent (no trunc) initializes cursor at 0 (beginning of file)", () => {
    const s = new FileStorageStrategy();
    const p = proc(10);
    const fd = 3;

    const cur: DataChunk[] = [mkChunk("ABCDE")];
    const res = s.applyEvent(openEvent(p, fd, 0) as any, cur);

    expect(res).toBe(cur);
    expect(content(res)).toBe(toHex("ABCDE"));

    const key = s.getKey(p as any, fd);
    expect(s.processCursorPositions.get(key)).toBe(0);       // Linux-like
    expect(s.doesProcessAppend.get(key)).toBe(false);
  });

  it("OpenEvent with O_TRUNC clears content and cursor is 0", () => {
    const s = new FileStorageStrategy();
    const p = proc(11);
    const fd = 4;

    const cur: DataChunk[] = [mkChunk("ABCDE")];
    const res = s.applyEvent(openEvent(p, fd, O_TRUNC) as any, cur);

    expect(res).toEqual([]);
    const key = s.getKey(p as any, fd);
    expect(s.processCursorPositions.get(key)).toBe(0);
    expect(s.doesProcessAppend.get(key)).toBe(false);
  });

  it("WriteEvent without O_APPEND writes at cursor (overwrites) and advances cursor by ret", () => {
    const s = new FileStorageStrategy();
    const p = proc(20);
    const fd = 5;

    let cur: DataChunk[] = [mkChunk("HELLOWORLD")]; // size 10
    cur = s.applyEvent(openEvent(p, fd, 0) as any, cur);

    // cursor=0, write 3 bytes => overwrite first 3 bytes
    cur = s.applyEvent(writeEvent(p, fd, toHex("12345"), 3) as any, cur);

    expect(content(cur)).toBe(toHex("123LOWORLD"));

    const key = s.getKey(p as any, fd);
    expect(s.processCursorPositions.get(key)).toBe(3);
  });

  it("ExitReadEvent advances cursor by bytes read", () => {
    const s = new FileStorageStrategy();
    const p = proc(21);
    const fd = 6;

    let cur: DataChunk[] = [mkChunk("123LOWORLD")];
    cur = s.applyEvent(openEvent(p, fd, 0) as any, cur);

    // simulate we've already read 3 bytes (cursor at 3)
    s.processCursorPositions.set(s.getKey(p as any, fd), 3);

    cur = s.applyEvent(exitReadEvent(p, fd, 2) as any, cur);

    expect(content(cur)).toBe(toHex("123LOWORLD"));
    expect(s.processCursorPositions.get(s.getKey(p as any, fd))).toBe(5);
  });

  it("getContent returns `ret` bytes starting at current cursor position", () => {
    const s = new FileStorageStrategy();
    const p = proc(22);
    const fd = 7;

    const cur: DataChunk[] = [mkChunk("123LOWORLD")];

    s.applyEvent(openEvent(p, fd, 0) as any, cur);
    // set cursor to 5 => expect 4 bytes from position 5: "WORL"
    s.processCursorPositions.set(s.getKey(p as any, fd), 5);

    const got = s.getContent(exitReadEvent(p, fd, 4) as any, cur);
    expect(content(got)).toBe(toHex("WORL"));
  });

  it("WriteEvent with O_APPEND always appends (write position = EOF), then cursor ends at EOF", () => {
    const s = new FileStorageStrategy();
    const p = proc(30);
    const fd = 8;

    let cur: DataChunk[] = [mkChunk("ABCDE")];
    cur = s.applyEvent(openEvent(p, fd, O_APPEND) as any, cur);

    // even though cursor starts at 0, append forces write at EOF
    cur = s.applyEvent(writeEvent(p, fd, toHex("XX"), 2) as any, cur);
    expect(content(cur)).toBe(toHex("ABCDEXX"));

    const key = s.getKey(p as any, fd);
    expect(s.processCursorPositions.get(key)).toBe(7);

    cur = s.applyEvent(writeEvent(p, fd, toHex("YY"), 2) as any, cur);
    expect(content(cur)).toBe(toHex("ABCDEXXYY"));
    expect(s.processCursorPositions.get(key)).toBe(9);
  });

  it("CloseEvent removes state", () => {
    const s = new FileStorageStrategy();
    const p = proc(40);
    const fd = 9;

    const cur: DataChunk[] = [mkChunk("abc")];
    s.applyEvent(openEvent(p, fd, 0) as any, cur);

    const key = s.getKey(p as any, fd);
    expect(s.processCursorPositions.has(key)).toBe(true);

    s.applyEvent(closeEvent(p, fd) as any, cur);

    expect(s.processCursorPositions.has(key)).toBe(false);
    expect(s.doesProcessAppend.has(key)).toBe(false);
  });

  it("Errors: writing/reading/closing unopened fd logs and keeps content unchanged", () => {
    const s = new FileStorageStrategy();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const p = proc(50);

    const cur: DataChunk[] = [mkChunk("abc")];

    expect(s.applyWriteEvent(writeEvent(p, 1, toHex("ZZ"), 2) as any, cur)).toBe(cur);
    expect(s.applyExitReadEvent(exitReadEvent(p, 1, 2) as any, cur)).toBe(cur);
    expect(s.applyCloseEvent(closeEvent(p, 1) as any, cur)).toBe(cur);

    expect(spy).toHaveBeenCalled();
    expect(content(cur)).toBe(toHex("abc"));
  });
});