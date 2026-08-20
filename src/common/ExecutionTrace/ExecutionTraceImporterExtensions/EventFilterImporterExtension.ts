

import { ExecutionTrace } from "../ExecutionTrace";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";

import { Resource, ResourceType } from "@common/types"


export default class EventFilterImporterExtension implements ExecutionTraceImporterExtension {

    static getTag(): string | null {
        return null
    }

    importData(executionTrace: ExecutionTrace, _json: JSON, _extensionData: JSON): boolean {
        console.log(`Executing ${EventFilterImporterExtension.name}`)

        const events = executionTrace.events
        const findBanned = executionTrace.resources
            .filter((r) => r.path === "/etc/localtime")
        const banResource = findBanned[0]
        console.log(banResource)
        const filteredEvents = events
            .filter((event) => !event.otherEntities.has(banResource))

        executionTrace.events = filteredEvents

        return true
    }
}