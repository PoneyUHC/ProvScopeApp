// tests/common/EventPattern.test.ts
import { describe, it, expect } from "vitest";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";

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

describe("EventPattern (predicate-based)", () => {
    it("stores its name and predicateCode", () => {
        const pattern = new EventPattern("MyPattern", "true");
        expect(pattern.name).toBe("MyPattern");
        expect(pattern.predicateCode).toBe("true");
    });

    it("returns true when predicate evaluates to true (expression form)", () => {
        const event = makeEvent({ type: "OpenEvent", pid: 1234 });
        const pattern = new EventPattern("P", `event.type === "OpenEvent" && event.pid === 1234`);
        expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("returns false when predicate evaluates to false (expression form)", () => {
        const event = makeEvent({ pid: 999 });
        const pattern = new EventPattern("P", `event.pid === 1234`);
        expect(pattern.matches(event as unknown as any)).toBe(false);
    });

    it("supports statement-body predicate code", () => {
        const event = makeEvent({ pid: 10 });
        const pattern = new EventPattern(
            "Body",
            `
                if (event.pid === 10) return true;
                return false;
            `
        );

        expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("throws when predicate does not evaluate to a boolean", () => {
        const event = makeEvent();
        const pattern = new EventPattern("Bad", `42`);
        expect(() => pattern.matches(event as unknown as any)).toThrow(/boolean/i);
    });

    it("can access nested fields in predicate code", () => {
        const event = makeEvent({ meta: { user: { id: "u2", name: "Bob" } } });
        const pattern = new EventPattern("Nested", `event.meta.user.id === "u2" && event.meta.user.name === "Bob"`);
        expect(pattern.matches(event as unknown as any)).toBe(true);
    });

    it("can access optional fields in predicate code", () => {
        const event = makeEvent({ file: { path: "/tmp/x", flags: 0 } });
        const pattern = new EventPattern("Optional", `event.file?.path === "/tmp/x" && event.file?.flags === 0`);
        expect(pattern.matches(event as unknown as any)).toBe(true);
    });
});
