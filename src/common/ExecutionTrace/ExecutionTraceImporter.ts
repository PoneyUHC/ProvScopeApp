
import { ExecutionTrace } from "./ExecutionTrace"
import { Process, Event, OpenEvent, CloseEvent, EnterReadEvent, ExitReadEvent, WriteEvent, Resource } from "../types"
import { importerExtensionsMapping } from "./ExecutionTraceImporterExtensions.ts/ImporterExtensionsMapping"


export default class ExecutionTraceImporter {

    static loadTraceFromJSON(executionTrace: ExecutionTrace, jsonString: string) {

        const json = JSON.parse(jsonString)
        const extensions: string[] = json._extensions || []

        for (const process of json.processes) {
            executionTrace.processes.push(new Process(process.name, process.pid))
        }

        for (const resource of json.resources) {
            executionTrace.resources.push(new Resource(resource.path, resource.resource_type))
        }

        for (const jsonEvent of json.events) {
            const event = ExecutionTraceImporter.createEventFromJSON(executionTrace, jsonEvent)
            if ( event ) {
                executionTrace.events.push(event)
            }
        }

        ExecutionTraceImporter.addEventIDs(executionTrace)

        for(const extension in extensions) {
            const extensionImporter = importerExtensionsMapping.get(extension)
            if ( !extensionImporter ) {
                console.error(`Could not find appropriate importer for extension ${extension}`)
                continue
            }
            extensionImporter.importData(executionTrace, json)
        }
    }


    private static createEventFromJSON(executionTrace: ExecutionTrace, json: any): Event | null {

        // TODO: either create a specific importer for these events
        // or do nothing related to event-specific treatment
        switch (json.event_type) {
            case "OpenEvent":
                return new OpenEvent(
                    json.timestamp,
                    executionTrace.processes[json.process],
                    executionTrace.resources[json.file],
                    json.fd,
                    json.mode,
                    json.flags
                )
            case "CloseEvent":
                return new CloseEvent(
                    json.timestamp,
                    executionTrace.processes[json.process],
                    json.fd
                )
            case "EnterReadEvent":
                return new EnterReadEvent(
                    json.timestamp,
                    executionTrace.processes[json.process],
                    json.fd,
                    json.count
                )
            case "ExitReadEvent":
                return new ExitReadEvent(
                    json.timestamp,
                    executionTrace.processes[json.process],
                    json.fd,
                    json.count,
                    json.content,
                    json.ret
                )
            case "WriteEvent":
                return new WriteEvent(
                    json.timestamp,
                    executionTrace.processes[json.process],
                    json.fd,
                    json.count,
                    json.content
                )
            
            default:
                console.error(`Unknown event type: ${json.event_type}`)
                return null
        }
    }


    static addEventIDs(executionTrace: ExecutionTrace) {
        for (const [id, event] of executionTrace.events.entries()) {
            event.id = id;
        }
    }
}