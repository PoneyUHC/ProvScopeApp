
import { describe, expect, it } from "vitest";
import { CausalProperty } from "@common/Provenance/IntraProcess/CausalProperty";
import { Process } from "@common/types";
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";

// --- helpers (keep these if constructor signatures evolve) ------------------

const EventPatternAny = EventPattern as any;
const CausalPropertyAny = CausalProperty as any;

function makeEventPattern(name: string): any {
  // Supports both: new EventPattern(name, pattern) and older variants.
  try {
    return new EventPatternAny(name, { eventType: "OpenEvent" });
  } catch {
    return new EventPatternAny({ eventType: "OpenEvent" });
  }
}

function makeCausalProperty(args: {
  name: string;
  dependencyMode: "dependent" | "independent";
  sourcePattern: any;
  targetPattern: any;
  predicateCode: string;
  process?: any;
}): any {
  // Supports both: positional constructor and object-props constructor.
  const proc = args.process ?? new Process("proc", 1);
  try {
    return new CausalPropertyAny(
      args.name,
      proc,
      args.dependencyMode,
      args.sourcePattern,
      args.targetPattern,
      args.predicateCode
    );
  } catch {
    return new CausalPropertyAny({
      name: args.name,
      process: proc,
      dependencyMode: args.dependencyMode,
      sourcePattern: args.sourcePattern,
      targetPattern: args.targetPattern,
      predicateCode: args.predicateCode,
    });
  }
}

function callEvaluate(property: any, sourceEvent: unknown, targetEvent: unknown): boolean {
  if (typeof property.evaluate === "function") return property.evaluate(sourceEvent, targetEvent);
  if (typeof property.predicate === "function") return property.predicate(sourceEvent, targetEvent);
  if (typeof property.test === "function") return property.test(sourceEvent, targetEvent);
  throw new Error("No evaluate-like method found on CausalProperty.");
}

function getSourcePattern(property: any): any {
  return property.sourcePattern ?? property.source ?? property.sourceEventPattern;
}

function getTargetPattern(property: any): any {
  return property.targetPattern ?? property.target ?? property.targetEventPattern;
}

// --- stub Event shape -------------------------------------------------------

interface StubEvent {
  eventType: string;
  pid: number;
  meta: {
    user: { id: string };
    extra: { tag: string };
  };
}

function makeEvent(userId: string, pid: number, tag: string): StubEvent {
  return {
    eventType: "OpenEvent",
    pid,
    meta: {
      user: { id: userId },
      extra: { tag },
    },
  };
}

// --- tests ------------------------------------------------------------------

describe("CausalProperty", () => {
  it("stores constructor fields (name/mode/pattern refs/code)", () => {
    const sourcePattern = makeEventPattern("SourcePattern");
    const targetPattern = makeEventPattern("TargetPattern");

    const property = makeCausalProperty({
      name: "MyProperty",
      dependencyMode: "dependent",
      sourcePattern,
      targetPattern,
      predicateCode: "true",
    });

    expect(property.name).toBe("MyProperty");
    expect(property.dependencyMode).toBe("dependent");
    expect(getSourcePattern(property)).toBe(sourcePattern);
    expect(getTargetPattern(property)).toBe(targetPattern);
    expect(property.predicateCode).toBe("true");
  });

  it("evaluate returns a boolean for expression code", () => {
    const sourcePattern = makeEventPattern("S");
    const targetPattern = makeEventPattern("T");

    const property = makeCausalProperty({
      name: "SameUser",
      dependencyMode: "dependent",
      sourcePattern,
      targetPattern,
      predicateCode: `sourceEvent.meta.user.id === targetEvent.meta.user.id`,
    });

    expect(callEvaluate(property, makeEvent("u1", 10, "a"), makeEvent("u1", 11, "b"))).toBe(true);
    expect(callEvaluate(property, makeEvent("u1", 10, "a"), makeEvent("u2", 10, "a"))).toBe(false);
  });

  it("evaluate supports statement-body code (return true/false)", () => {
    const sourcePattern = makeEventPattern("S");
    const targetPattern = makeEventPattern("T");

    const property = makeCausalProperty({
      name: "SamePid",
      dependencyMode: "dependent",
      sourcePattern,
      targetPattern,
      predicateCode: `
        if (sourceEvent.pid === targetEvent.pid) return true;
        return false;
      `,
    });

    expect(callEvaluate(property, makeEvent("u1", 42, "x"), makeEvent("u2", 42, "y"))).toBe(true);
    expect(callEvaluate(property, makeEvent("u1", 1, "x"), makeEvent("u2", 2, "y"))).toBe(false);
  });

  it("throws if code does not evaluate to a boolean", () => {
    const sourcePattern = makeEventPattern("S");
    const targetPattern = makeEventPattern("T");

    const property = makeCausalProperty({
      name: "BadReturn",
      dependencyMode: "independent",
      sourcePattern,
      targetPattern,
      predicateCode: `42`,
    });

    expect(() => callEvaluate(property, makeEvent("u1", 1, "x"), makeEvent("u1", 1, "x"))).toThrow(
      /boolean/i
    );
  });

  it("independent/dependent mode is kept as-is", () => {
    const sourcePattern = makeEventPattern("S");
    const targetPattern = makeEventPattern("T");

    const dependentProperty = makeCausalProperty({
      name: "Dep",
      dependencyMode: "dependent",
      sourcePattern,
      targetPattern,
      predicateCode: "true",
    });

    const independentProperty = makeCausalProperty({
      name: "Indep",
      dependencyMode: "independent",
      sourcePattern,
      targetPattern,
      predicateCode: "true",
    });

    expect(dependentProperty.dependencyMode).toBe("dependent");
    expect(independentProperty.dependencyMode).toBe("independent");
  });
});
