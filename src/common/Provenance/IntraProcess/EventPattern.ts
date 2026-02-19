
import { Event } from "@common/types";

export class EventPattern {
    readonly name: string;
    readonly predicateCode: string;

    private readonly compiledPredicate: (event: Event) => unknown;

    constructor(name: string, predicateCode: string) {
        this.name = name;
        this.predicateCode = predicateCode;
        this.compiledPredicate = EventPattern.compilePredicate(predicateCode);
    }

    matches(event: Event): boolean {
        const result = this.compiledPredicate(event);
        if (typeof result !== "boolean") {
            throw new Error("EventPattern predicate code must evaluate to a boolean.");
        }
        return result;
    }

    private static compilePredicate(predicateCode: string): (event: Event) => unknown {
        // ⚠️ Only safe for trusted/dev tooling
        try {
            // Expression form: `event.pid === 42`
            return new Function("event", `"use strict"; return (${predicateCode});`) as any;
        } catch {
            // Statement-body form: `if (...) return true; return false;`
            return new Function("event", `"use strict"; ${predicateCode}`) as any;
        }
    }
}