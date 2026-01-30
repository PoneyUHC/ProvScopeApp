
import { Event } from "@common/types"
import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";


export type DependencyMode = "dependent" | "independent";


export class CausalProperty {
  readonly name: string;
  readonly dependencyMode: DependencyMode;

  readonly sourcePattern: EventPattern;
  readonly targetPattern: EventPattern;

  readonly predicateCode: string;

  private readonly compiledPredicate: (sourceEvent: Event, targetEvent: Event) => unknown;

  constructor(
    name: string,
    dependencyMode: DependencyMode,
    sourcePattern: EventPattern,
    targetPattern: EventPattern,
    predicateCode: string
  ) {
    this.name = name;
    this.dependencyMode = dependencyMode;

    this.sourcePattern = sourcePattern;
    this.targetPattern = targetPattern;

    this.predicateCode = predicateCode;
    this.compiledPredicate = CausalProperty.compilePredicate(predicateCode);
  }

  evaluate(sourceEvent: Event, targetEvent: Event): boolean {
    const result = this.compiledPredicate(sourceEvent, targetEvent);
    if (typeof result !== "boolean") {
      throw new Error("Alignement property code must evaluate to a boolean.");
    }
    return result;
  }

  private static compilePredicate(
    predicateCode: string
  ): (sourceEvent: Event, targetEvent: Event) => unknown {
    // ⚠️ Only safe for trusted/dev tooling
    try {
      return new Function(
        "sourceEvent",
        "targetEvent",
        `"use strict"; return (${predicateCode});`
      ) as any;
    } catch {
      return new Function(
        "sourceEvent",
        "targetEvent",
        `"use strict"; ${predicateCode}`
      ) as any;
    }
  }
}
