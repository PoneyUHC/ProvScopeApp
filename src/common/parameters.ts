
import { Event } from "./types" 


// TODO: it should be possible to set these parameters from within the app  

export const eventColors = {
    "OpenEvent": "yellow",
    "WriteEvent": "blue",
    "ExitReadEvent": "green",
    "CloseEvent": "black"
}


export const excludedEvents = [
    "EnterReadEvent"
]


function areEventsSimilar(event1: Event, event2: Event): boolean {
    return event1.process == event2.process && 
        event1.eventType === event2.eventType &&
        [...event1.targetEntities].every((e) => event2.targetEntities.has(e))
}


export function mergeEvents(event1: Event, event2: Event): Event | null {

    if (!areEventsSimilar(event1, event2)) {
        return null;
    }

    let possibleNewEvent: Event | null = null

    if (event1.eventType === "ExitReadEvent") {
        possibleNewEvent = mergeReadEvents()
    } else if (event1.eventType === "WriteEvent") {
        possibleNewEvent = mergeWriteEvents()
    }

    return possibleNewEvent
}


function mergeReadEvents(event1: Event, event2: Event): Event | null {

    let possibleNewEvent

    event1.outputValues["content"]


    return possibleNewEvent
}