// tests/common/EventPattern.test.ts
import { describe, it, expect } from "vitest";
import { EventPattern, getPath } from "@common/Provenance/IntraProcess/EventPattern";

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
    const event = makeEvent();
    expect(getPath(event, "")).toBe(event);
  });

  it("reads a top-level field", () => {
    const event = makeEvent({ pid: 42 });
    expect(getPath(event, "pid")).toBe(42);
  });

  it("reads a nested field", () => {
    const event = makeEvent();
    expect(getPath(event, "meta.user.name")).toBe("Alice");
  });

  it("returns null when an intermediate value is not indexable (primitive)", () => {
    const event = makeEvent({ pid: 42 });
    // pid is a number, so pid.anything should fail
    expect(getPath(event, "pid.anything")).toBeNull();
  });

  it("returns null when a missing key is encountered", () => {
    const event = makeEvent();
    expect(getPath(event, "meta.user.unknownField")).toBeNull();
  });

  it("returns null when the resolved value is falsy (0) due to current implementation", () => {
    const event = makeEvent({ file: { path: "/tmp/x", flags: 0 } });
    // NOTE: getPath returns `current ? current : null`, so 0 becomes null.
    expect(getPath(event, "file.flags")).toBeNull();
  });

  it("returns null when the resolved value is falsy (empty string) due to current implementation", () => {
    const event = makeEvent({ file: { path: "" } });
    // Empty string is falsy => null with current code
    expect(getPath(event, "file.path")).toBeNull();
  });

  it("can access array elements by numeric string keys", () => {
    const event = makeEvent({ meta: { user: { id: "u1", name: "Alice" }, tags: ["x", "y"] } });
    expect(getPath(event, "meta.tags.0")).toBe("x");
    expect(getPath(event, "meta.tags.1")).toBe("y");
  });
});

describe("EventPattern", () => {
  it("stores its name", () => {
    const pattern = new EventPattern("MyPattern", { pid: 1234 });
    expect(pattern.name).toBe("MyPattern");
  });

  describe("matches", () => {
    it("returns true when all requested fields match", () => {
      const event = makeEvent({ type: "OpenEvent", pid: 1234 });
      const pattern = new EventPattern("P", {
        type: "OpenEvent",
        "meta.user.id": "u1",
      });

      expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("returns false when at least one requested field differs", () => {
      const event = makeEvent({ pid: 999 });
      const pattern = new EventPattern("P", { pid: 1234 });

      expect(pattern.matches(event as unknown as any)).toBe(false);
    });

    it("returns null when a requested field path does not exist", () => {
      const event = makeEvent();
      const pattern = new EventPattern("P", { "meta.user.doesNotExist": "x" });

      expect(pattern.matches(event as unknown as any)).toBeNull();
    });

    it("returns null when a requested field exists but resolves to a falsy value (0) with current getPath", () => {
      const event = makeEvent({ file: { path: "/tmp/x", flags: 0 } });
      const pattern = new EventPattern("P", { "file.flags": 0 });

      // Because getPath("file.flags") -> null, matches returns null (not true)
      expect(pattern.matches(event as unknown as any)).toBeNull();
    });

    it("returns true when pattern is empty", () => {
      const event = makeEvent();
      const pattern = new EventPattern("Empty", {});

      expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("compares with loose inequality (!=) as implemented (e.g., '1234' matches 1234)", () => {
      const event = makeEvent({ pid: 1234 });
      const pattern = new EventPattern("Loose", { pid: "1234" as any });

      // requestedValue != fieldValue  => "1234" != 1234 is false (loose), so it "matches"
      expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("supports nested comparisons", () => {
      const event = makeEvent({ meta: { user: { id: "u2", name: "Bob" }, tags: ["a"] } });
      const pattern = new EventPattern("Nested", {
        "meta.user.name": "Bob",
        "meta.user.id": "u2",
      });

      expect(pattern.matches(event as unknown as any)).toBe(true);
    });
  });
});
