
import { ExecutionTrace } from "./ExecutionTrace"
import { Process, Event, Resource, Entity } from "../types"
import { staticExtensions, tagToImporterMapping } from "./ExecutionTraceImporterExtensions.ts/ImporterExtensionsGlobals"


export default class ExecutionTraceImporter {

    static loadTraceFromJSON(executionTrace: ExecutionTrace, jsonString: string) {

        const json = JSON.parse(jsonString)
        const extensionsData = json._extensions || []

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

        for (const extensionData of extensionsData) {
            const extensionTag = extensionData.tag
            const extensionImporter = tagToImporterMapping.get(extensionTag)
            if ( !extensionImporter ) {
                console.error(`Could not find appropriate importer for extension ${extensionTag}`)
                continue
            }
            const importSuccess = extensionImporter.importData(executionTrace, json, extensionData.data)
            if (importSuccess) {
                executionTrace.extensions.push(extensionTag)
            }
        }
        
        for (const extension of staticExtensions) {
            extension.importData(executionTrace, json, null)
        }

        ExecutionTraceImporter.addEventIDs(executionTrace)

        console.error(executionTrace.events.length)
    }


    private static getProcessByIndex(executionTrace: ExecutionTrace, index: number): Process | null {
        const process = executionTrace.processes[index]
        if ( !process ) {
            console.error(`Could not find process with index ${index}`)
            return null
        }
        return process
    }


    private static getResourceByIndex(executionTrace: ExecutionTrace, index: number): Resource | null {
        const resource = executionTrace.resources[index]
        if ( !resource ) {
            console.error(`Could not find resource with index ${index}`)
            return null
        }
        return resource
    }


    private static getEntity(executionTrace: ExecutionTrace, entityPath: string): Entity | null {
        const [type, index] = entityPath.split(":")
        if ( type === "p" ) {
            return ExecutionTraceImporter.getProcessByIndex(executionTrace, Number(index))
        } else if ( type === "r" ) {
            return ExecutionTraceImporter.getResourceByIndex(executionTrace, Number(index))
        }
        console.error(`Unknown entity type ${type}`)
        return null
    }

    private static createEventFromJSON(executionTrace: ExecutionTrace, json: any): Event | null {

        const process = ExecutionTraceImporter.getEntity(executionTrace, json.process)
        if ( !process ) {
            console.error(`Could not create event, process with index ${json.process} not found`)
            return null
        }

        const otherEntities: Set<Entity> = new Set()
        for ( const otherEntityIndex of json.other_entities ) {
            const entity = ExecutionTraceImporter.getEntity(executionTrace, otherEntityIndex)
            if ( entity ) {
                otherEntities.add(entity)
            }
        }

        const sourceEntities: Set<Entity> = new Set()
        for ( const sourceEntityIndex of json.source_entities ) {
            const entity = ExecutionTraceImporter.getEntity(executionTrace, sourceEntityIndex)
            if ( entity ) {
                sourceEntities.add(entity)
            }
        }

        const targetEntities: Set<Entity> = new Set()
        for ( const targetEntityIndex of json.target_entities ) {
            const entity = ExecutionTraceImporter.getEntity(executionTrace, targetEntityIndex)
            if ( entity ) {
                targetEntities.add(entity)
            }
        }

        const inputValues = json.input_values
        const outputValues = json.output_values

        return new Event(
            json.timestamp,
            process as Process,
            json.event_type,
            otherEntities,
            sourceEntities,
            targetEntities,
            inputValues,
            outputValues,
            json.description
        )
    }


    static addEventIDs(executionTrace: ExecutionTrace) {
        for (const [id, event] of executionTrace.events.entries()) {
            event.id = id;
        }
    }
}