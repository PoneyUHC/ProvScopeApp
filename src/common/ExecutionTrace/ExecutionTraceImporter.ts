
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

        for (const file of json.files) {
            executionTrace.resources.push(new Resource(file.path, file.file_type))
        }

        for( const channel of json.channels) {
            executionTrace.channels.push(channel)
        }

        for (const jsonEvent of json.events) {
            const event = ExecutionTraceImporter.createEventFromJSON(executionTrace, jsonEvent)
            if ( event ) {
                executionTrace.events.push(event)
            }
        }

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
}