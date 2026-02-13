

import { ExecutionTrace } from "../ExecutionTrace";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";

import { Event } from "@common/types"


export default class EventMergerImporterExtension implements ExecutionTraceImporterExtension {

    static getTag(): string | null {
        return null
    }

    importData(executionTrace: ExecutionTrace, _json: JSON, _extensionData: JSON): boolean {
        console.log(`Executing ${EventMergerImporterExtension.name}`)

        const events = executionTrace.events
        const newEvents: Event[] = [events[0]]
        for (let i=1; i<events.length; ++i) {
            const event1 = newEvents.pop()!
            const event2 = events[i]

            const mergedEvent = mergeEvents(event1, event2)
            if (mergedEvent) {
                newEvents.push(mergedEvent)
            } else {
                newEvents.push(event1)
                newEvents.push(event2)
            }
        }

        executionTrace.events = newEvents

        return true
    }
}


function areEventsSimilar(event1: Event, event2: Event): boolean {
    return event1.process === event2.process && 
        event1.eventType === event2.eventType &&
        [...event1.targetEntities].every((e) => event2.targetEntities.has(e))
}


function isErrorFreeEvent(event: Event): boolean {
    const ret = event.outputValues["ret"]
    const size = event.inputValues["size"]
    return ret >= 0 && ret === size
}


function mergeEvents(event1: Event, event2: Event): Event | null {

    if (!areEventsSimilar(event1, event2)) {
        return null;
    }

    if ( !isErrorFreeEvent(event1) || !isErrorFreeEvent(event2) ) {
        return null;
    }
    
    let mergedEvent: Event | null = null

    if (event1.eventType === "ExitReadEvent") {
        mergedEvent = mergeReadEvents(event1, event2)
    } else if (event1.eventType === "WriteEvent") {
        mergedEvent = mergeWriteEvents(event1, event2)
    }

    return mergedEvent
}


function mergeReadEvents(event1: Event, event2: Event): Event {

    const size = event1.inputValues["size"] + event2.inputValues["size"]
    const ret = event1.outputValues["ret"] + event2.outputValues["ret"]
    const content = event1.outputValues["content"] + event2.outputValues["content"]

    let description = event1.description
    if (!event1.description.startsWith("[MERGED]")) {
        description = "[MERGED] " + description
    }

    const mergedEvent = new Event(
        event1.timestamp,
        event1.process,
        event1.eventType,
        event1.otherEntities,
        event1.sourceEntities,
        event1.targetEntities,
        { fd: event1.inputValues["fd"], size: size },
        { ret: ret, content: content},
        description
    )

    mergedEvent.color = event1.color

    return mergedEvent
}


function mergeWriteEvents(event1: Event, event2: Event): Event {

    const size = event1.inputValues["size"] + event2.inputValues["size"]
    const ret = event1.outputValues["ret"] + event2.outputValues["ret"]
    const content = event1.outputValues["content"] + event2.outputValues["content"]

    let description = event1.description
    if (!event1.description.startsWith("[MERGED]")) {
        description = "[MERGED] " + description
    }

    const mergedEvent = new Event(
        event1.timestamp,
        event1.process,
        event1.eventType,
        event1.otherEntities,
        event1.sourceEntities,
        event1.targetEntities,
        { fd: event1.inputValues["fd"], size: size },
        { ret: ret, content: content},
        description
    )

    return mergedEvent
}