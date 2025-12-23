
import ExecutionTraceExporter from "./ExecutionTraceExporter"
import ExecutionTraceImporter from "./ExecutionTraceImporter"
import { Process, Resource, Event, Entity } from "../types"
import { IClonable } from "../utils"


export class ExecutionTrace implements IClonable<ExecutionTrace> {

    filename: string

    processes: Process[]
    resources: Resource[]
    events: Event[]
    
    // redundant but useful for quick lookup
    entities: Entity[]

    extensions: string[]


    constructor(filename: string, jsonString: string) {
        this.filename = filename
        this.processes = []
        this.resources = []
        this.events = []
        this.extensions = []

        ExecutionTraceImporter.loadTraceFromJSON(this, jsonString)

        this.entities = [...this.processes, ...this.resources]
    }


    getEventTypes(): Set<string> {
        const eventTypes = this.events.map((e) => e.eventType)
        return new Set<string>(eventTypes)
    }


    static toJSON(trace: ExecutionTrace): string {
        return ExecutionTraceExporter.toJSON(trace)
    }


    clone(): ExecutionTrace {
        const clone = { ...this }
        clone.filename = this.filename
        clone.processes = this.processes.map((process) => process.clone())
        clone.resources = this.resources.map((file) => file.clone())
        clone.entities = this.entities.map((entity) => entity.clone())
        clone.events = [...this.events]
        clone.extensions = [...this.extensions]
        return clone
    }

}