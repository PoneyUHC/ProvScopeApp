
import { Event } from '@common/types';
import { getPath } from '@common/utils';


export class EventPattern {

    pattern: Record<string, unknown>

    constructor(pattern: Record<string, unknown>) {
        this.pattern = pattern;
    }

    matches(event: Event): boolean | null {
        for (const [key, requestedValue] of Object.entries(this.pattern)) {
            const fieldValue = getPath(event, key)
            if (!fieldValue) {
                return null
            }

            if (requestedValue != fieldValue) {
                return false
            }
        }
        return true;
    }
}
