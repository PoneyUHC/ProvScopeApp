
import ExecutionTraceExporter from "./ExecutionTraceExporter"
import ExecutionTraceImporter from "./ExecutionTraceImporter"
import { Process, File, Event } from "../types"
import { IClonable } from "../utils"


export class ExecutionTrace implements IClonable<ExecutionTrace> {

    filename: string

    processes: Process[]
    files: File[]
    channels: string[]
    events: Event[]
    

    constructor(filename: string, jsonString: string) {
        this.filename = filename
        this.processes = []
        this.files = []
        this.channels = []
        this.events = []

        ExecutionTraceImporter.loadTraceFromJSON(this, jsonString)
    }


    static toJSON(trace: ExecutionTrace): string {
        return ExecutionTraceExporter.toJSON(trace)
    }


    clone(): ExecutionTrace {
        const clone = { ...this }
        clone.filename = this.filename
        clone.processes = this.processes.map((process) => process.clone())
        clone.files = this.files.map((file) => file.clone())
        clone.events = [...this.events]
        return clone
    }

}