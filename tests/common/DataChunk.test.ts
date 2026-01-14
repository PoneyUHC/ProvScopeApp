
import { describe, it, expect } from "vitest";
import DataChunk from "@common/Provenance/InterProcess/DataChunk"; // <- adjust path

// Helper: keep tests readable
function mk(data: string, originEvent: any = { id: "e" }): DataChunk {
  return new DataChunk(data, originEvent);
}

function content(chunks: DataChunk[]): string {
  return chunks.map(c => c.data).join("");
}

function totalSize(chunks: DataChunk[]): number {
  return chunks.reduce((acc, c) => acc + c.size, 0);
}

describe("DataChunk.insertAt", () => {
  it("appends when position is exactly at the end", () => {
    const e = { id: "e1" };
    const chunks = [mk("ABCDE", e), mk("FGHIJ", e)];
    const newChunk = mk("XY", e);

    const res = DataChunk.insertAt(chunks, newChunk, 10);

    expect(content(res)).toBe("ABCDEFGHIJXY");
    expect(totalSize(res)).toBe(12);

    // does not mutate input
    expect(content(chunks)).toBe("ABCDEFGHIJ");
  });

  it("pads with \\0 when inserting beyond the end", () => {
    const eOld = { id: "old" };
    const eNew = { id: "new" };
    const chunks = [mk("ABCDEFGHIJ", eOld)];
    const newChunk = mk("XY", eNew);

    const res = DataChunk.insertAt(chunks, newChunk, 12);

    expect(content(res)).toBe("ABCDEFGHIJ" + "\0\0" + "XY");
    expect(totalSize(res)).toBe(14);

    // padding chunk should use newChunk.originEvent (as your code does)
    expect(res[1].data).toBe("\0\0");
    expect(res[1].sourceEvent).toBe(eNew);
  });

  it("inserts inside a single chunk and preserves both prefix and suffix", () => {
    const e = { id: "e" };
    const chunks = [mk("HELLOWORLD", e)]; // size 10
    const newChunk = mk("123", e);        // size 3

    // overwrite at pos=2 (0-based): HE + 123 + WORLD
    const res = DataChunk.insertAt(chunks, newChunk, 2);

    expect(content(res)).toBe("HE123WORLD");
    expect(totalSize(res)).toBe(10);

    // expected chunk structure: ["HE", "123", "WORLD"]
    expect(res.map(c => c.data)).toEqual(["HE", "123", "WORLD"]);
  });

  it("overwrites across chunk boundary and keeps remainder of the end chunk + following chunks", () => {
    const e = { id: "e" };
    const chunks = [mk("AAAAA", e), mk("BBBBB", e), mk("CCCCC", e)];
    const newChunk = mk("XXXXXX", e); // size 6

    // position 3, overwrite 6 bytes: AAAAA + BBBBB + CCCCC
    // prefix: "AAA"
    // overwritten: A[3..5] (2) + B[0..4] (4)
    // remainder of B: "B"
    // following: "CCCCC"
    const res = DataChunk.insertAt(chunks, newChunk, 3);

    expect(content(res)).toBe("AAAXXXXXXBCCCCC");
    expect(totalSize(res)).toBe(15);

    expect(res.map(c => c.data)).toEqual(["AAA", "XXXXXX", "B", "CCCCC"]);
  });

  it("inserts exactly at a chunk boundary (no empty prefix chunk) and overwrites into the next chunk", () => {
    const e = { id: "e" };
    const chunks = [mk("AAAAA", e), mk("BBBBB", e), mk("CCCCC", e)];
    const newChunk = mk("ZZ", e); // size 2

    // insert at pos=5 => right between A and B, overwrite first 2 bytes of B
    // result: A + ZZ + "BBB" + C
    const res = DataChunk.insertAt(chunks, newChunk, 5);

    expect(content(res)).toBe("AAAAAZZBBBCCCCC");
    expect(totalSize(res)).toBe(15);

    expect(res.map(c => c.data)).toEqual(["AAAAA", "ZZ", "BBB", "CCCCC"]);
  });
});