
import { Event } from '@common/types';

// TODO: switch to a constraint system for more complex patterns
export class PatternValue {

    value: unknown;
    isWildcard: boolean;
    
    constructor(value: unknown, isWildcard: boolean = false) {
        this.value = value;
        this.isWildcard = isWildcard;
    }

    matches(other: unknown): boolean {
        if (this.isWildcard) {
            return true;
        }
        return this.value == other;
    }
}

export class EventPattern {

    pattern: Map<string, PatternValue>

    constructor(pattern: Map<string, PatternValue>) {
        this.pattern = pattern;
    }

    matches(event: Event): boolean {
        console.debug("EventPattern.matches", event, this.pattern);
        for (const [key, value] of this.pattern.entries()) {
            if (!value.matches(event[key as keyof (typeof Event)])) {
                console.debug(`EventPattern.matches: mismatch for key ${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(event[key as keyof (typeof Event)])}`);
                return false;
            }
        }
        console.debug("EventPattern.matches: match found");
        return true;
    }
}
