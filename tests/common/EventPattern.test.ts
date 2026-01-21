// tests/common/EventPattern.test.ts
import { describe, it, expect } from "vitest";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern"; // <-- adjust
import { getPath } from "@common/utils";

/** Stub Event type + helpers for tests */
type Event = {
  type: string;
  pid: number;
  meta: {
    user: {
      id: string;
      name: string;
    };
    tags?: string[];
  };
  file?: {
    path: string;
    flags?: number;
  };
};

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    type: "OpenEvent",
    pid: 1234,
    meta: {
      user: { id: "u1", name: "Alice" },
      tags: ["a", "b"],
    },
    file: { path: "/tmp/x", flags: 0 },
    ...overrides,
  };
}

describe("getPath", () => {
  it("returns the object itself when path is empty", () => {
    const e = makeEvent();
    expect(getPath(e, "")).toBe(e);
  });

  it("reads a top-level field", () => {
    const e = makeEvent({ pid: 42 });
    expect(getPath(e, "pid")).toBe(42);
  });

  it("reads a nested field", () => {
    const e = makeEvent();
    expect(getPath(e, "meta.user.name")).toBe("Alice");
  });

  it("returns null when an intermediate value is not indexable (primitive)", () => {
    const e = makeEvent({ pid: 42 });
    // pid is a number, so pid.anything should fail
    expect(getPath(e, "pid.anything")).toBeNull();
  });

  it("returns null when a missing key is encountered", () => {
    const e = makeEvent();
    expect(getPath(e, "meta.user.unknownField")).toBeNull();
  });

  it("returns null when the resolved value is falsy (0) due to current implementation", () => {
    const e = makeEvent({ file: { path: "/tmp/x", flags: 0 } });
    // NOTE: getPath returns `current ? current : null`, so 0 becomes null.
    expect(getPath(e, "file.flags")).toBeNull();
  });

  it("returns null when the resolved value is falsy (empty string) due to current implementation", () => {
    const e = makeEvent({ file: { path: "" } });
    // Empty string is falsy => null with current code
    expect(getPath(e, "file.path")).toBeNull();
  });

  it("can access array elements by numeric string keys", () => {
    const e = makeEvent({ meta: { user: { id: "u1", name: "Alice" }, tags: ["x", "y"] } });
    expect(getPath(e, "meta.tags.0")).toBe("x");
    expect(getPath(e, "meta.tags.1")).toBe("y");
  });
});

describe("EventPattern.matches", () => {
  it("returns true when all requested fields match", () => {
    const e = makeEvent({ type: "OpenEvent", pid: 1234 });
    const p = new EventPattern({
      type: "OpenEvent",
      "meta.user.id": "u1",
    });

    expect(p.matches(e as unknown as any)).toBe(true);
  });

  it("returns false when at least one requested field differs", () => {
    const e = makeEvent({ pid: 999 });
    const p = new EventPattern({ pid: 1234 });

    expect(p.matches(e as unknown as any)).toBe(false);
  });

  it("returns null when a requested field path does not exist", () => {
    const e = makeEvent();
    const p = new EventPattern({ "meta.user.doesNotExist": "x" });

    expect(p.matches(e as unknown as any)).toBeNull();
  });

  it("returns null when a requested field exists but resolves to a falsy value (0) with current getPath", () => {
    const e = makeEvent({ file: { path: "/tmp/x", flags: 0 } });
    const p = new EventPattern({ "file.flags": 0 });

    // Because getPath("file.flags") -> null, matches returns null (not true)
    expect(p.matches(e as unknown as any)).toBeNull();
  });

  it("returns true when pattern is empty", () => {
    const e = makeEvent();
    const p = new EventPattern({});

    expect(p.matches(e as unknown as any)).toBe(true);
  });

  it("compares with loose inequality (!=) as implemented (e.g., '1234' matches 1234)", () => {
    const e = makeEvent({ pid: 1234 });
    const p = new EventPattern({ pid: "1234" }); // requestedValue is string

    // requestedValue != fieldValue  => "1234" != 1234 is false (loose), so it "matches"
    expect(p.matches(e as unknown as any)).toBe(true);
  });

  it("supports nested comparisons", () => {
    const e = makeEvent({ meta: { user: { id: "u2", name: "Bob" }, tags: ["a"] } });
    const p = new EventPattern({
      "meta.user.name": "Bob",
      "meta.user.id": "u2",
    });

    expect(p.matches(e as unknown as any)).toBe(true);
  });
});
