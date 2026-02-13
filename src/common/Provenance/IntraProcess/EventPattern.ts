
import { Event } from "@common/types";


export class EventPattern {
  readonly name: string;
  readonly pattern: Record<string, unknown>;

  constructor(name: string, pattern: Record<string, unknown>) {
    this.name = name;
    this.pattern = pattern;
  }

  matches(event: Event): boolean | null {
    for (const [key, requestedValue] of Object.entries(this.pattern)) {
      const fieldValue = getPath(event, key);
      if (!fieldValue) {
        return null;
      }

      if (requestedValue != fieldValue) {
        return false;
      }
    }
    return true;
  }
}

function isIndexable(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function getPath(obj: object, path: string): object | null {
  if (!path) return obj;

  let current: unknown = obj;

  for (const key of path.split(".")) {
    if (!isIndexable(current)) return null;
    current = current[key];
  }

  return current ? (current as object) : null;
}
