
import { Event } from "@common/types";

import { TKEInstance } from "./TKEInstance";
import { TKEResultParser } from "./TKEResultParser";
import { TKESolver } from "./TKESolver";
import { TKEParsedResult, TKESolverArguments, TKESolverOptions } from "./TKETypes";
import { simpleHash } from "@common/utils";


export class TKEWrapper {

    private summaryIDList: number[] = []

    private readonly solverOptions: TKESolverOptions

    constructor(solverOptions: TKESolverOptions) {
        this.solverOptions = solverOptions
    }

    async findTopKMotifs(eventList: Event[], args: TKESolverArguments): Promise<Event[][][]> {
        const instance = new TKEInstance(
            eventList.map((event) => this.summarizeEvent(event))
        )

        const solver = new TKESolver(this.solverOptions)
        const result = await solver.solve(instance, args)
        const parsedResult = TKEResultParser.parse(result)

        return this.findEventsFromIDs(
            parsedResult,
            eventList
        )
    }

    private summarizeEvent(_event: Event): number {
        
        const hashKeys = [
            _event.process.getUUID(),
            _event.eventType,
            ...Array.from(_event.sourceEntities).map((entity) => entity.getUUID()).sort(),
            ...Array.from(_event.targetEntities).map((entity) => entity.getUUID()).sort()
        ]

        const summaryKey = JSON.stringify(hashKeys)
        const summaryID = simpleHash(summaryKey)

        this.summaryIDList.push(summaryID)

        return summaryID
    }


    private findEventsFromIDs(parsedResult: TKEParsedResult, _eventList: Event[]): Event[][][] {
        
        const matchingEvents: Event[][][] = []

        for (const result of parsedResult) {
            
        }
        
        return matchingEvents
    }
}
