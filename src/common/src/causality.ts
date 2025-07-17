
import { Process, Event } from "./types";
import DataflowGraph from './DataflowGraph';


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


export class PatternGroup {

    patterns: EventPattern[];
    name: string;

    constructor(patterns: EventPattern[], name: string) {
        this.patterns = patterns;
        this.name = name;
    }
}


export class ProcessVariable {

    name: string 
    process: Process

    constructor(name: string, process: Process) {
        this.name = name
        this.process = process
    }

    toString() {
        return this.name
    }
}

export type AlterationType = 
    | { type: 'PRESERVE' }
    | { type: 'ALTER', variable: string };

    

export interface CausalLink {
    appliesTo: (event: Event) => boolean;
    getCauses(event: Event, dfGraph: DataflowGraph): Set<Event>;
}


const getProcessPriorEvents = (dfGraph: DataflowGraph, baseEvent: Event): Event[] => {
    const graph = dfGraph.graph;
    const baseEventID = baseEvent.id;
    const nodes = graph.filterNodes((node) => { 
        const eventID = graph.getNodeAttribute(node, 'id')
        const event = graph.getNodeAttribute(node, 'event')
        return event && event.process == baseEvent.process && eventID < baseEventID
    });
    return nodes.map((node) => graph.getNodeAttribute(node, 'event'));
}


export class FollowUpCL implements CausalLink {

    eventPatterns: EventPattern[];

    constructor(eventPatterns: EventPattern[]) {
        this.eventPatterns = eventPatterns;
    }

    appliesTo(_event: Event): boolean {
        return true;
    }

    getCauses(event: Event, dfGraph: DataflowGraph): Set<Event> {

        console.debug("FollowUpCL.getCauses", event);
        const graph = dfGraph.graph;
        const sources: Set<Event> = new Set();

        let node = graph.findNode((n) => graph.getNodeAttribute(n, 'event') == event);
        if (!node) {
            console.error("Unexpected error !")
            return new Set();
        }

        const priorEventsInSameProcess = getProcessPriorEvents(dfGraph, event);
        if (priorEventsInSameProcess.length < this.eventPatterns.length) {
            console.debug("Cannot match: not enough prior events found for event", event);
            return new Set();
        }

        const priorEvents = priorEventsInSameProcess.slice(-this.eventPatterns.length);

        for (const [i, pattern] of this.eventPatterns.entries()) {
            if (pattern.matches(priorEvents[i])) {
                sources.add(priorEvents[i]);
            } else {
                console.debug("Cannot match: event does not match pattern", priorEvents[i], pattern);
                return new Set();
            }
        }

        return sources;
    }
}


export class SourceTargetCL implements CausalLink {

    source: EventPattern;
    target: EventPattern;

    constructor(source: EventPattern, target: EventPattern) {
        this.source = source;
        this.target = target;
    }

    appliesTo(event: Event): boolean {
        return this.target.matches(event);
    }

    getCauses(event: Event, dfGraph: DataflowGraph): Set<Event> {
        
        if (!this.target.matches(event)) {
            return new Set();
        }
        
        const priorEvents = getProcessPriorEvents(dfGraph, event);
        if (priorEvents.length === 0) {
            return new Set();
        }
        
        const sources: Set<Event> = new Set();
        for (const priorEvent of priorEvents) {
            if (this.source.matches(priorEvent)) {
                sources.add(priorEvent);
            }
        }

        return sources;
    }
}