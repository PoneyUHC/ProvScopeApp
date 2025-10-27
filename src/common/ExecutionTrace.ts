
import { Process, File, Event, OpenEvent, CloseEvent, EnterReadEvent, ExitReadEvent, WriteEvent } from "./types"
import { IClonable } from "./utils"


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

        this.loadTraceFromJSON(jsonString)
    }


    loadTraceFromJSON(jsonString: string) {

        const json = JSON.parse(jsonString)

        for (const process of json.processes) {
            this.processes.push(new Process(process.name, process.pid))
        }

        for (const file of json.files) {
            this.files.push(new File(file.path))
        }

        for( const channel of json.channels) {
            this.channels.push(channel)
        }

        for (const jsonEvent of json.events) {
            const event = this.createEventFromJSON(jsonEvent)
            if ( event ) {
                this.events.push(event)
            }
        }
    }


    createEventFromJSON(json: any): Event | null {

        switch (json.event_type) {
            case "OpenEvent":
                return new OpenEvent(
                    json.timestamp,
                    this.processes[json.process],
                    this.files[json.file],
                    json.fd,
                    json.mode,
                    json.flags
                )
            case "CloseEvent":
                return new CloseEvent(
                    json.timestamp,
                    this.processes[json.process],
                    json.fd
                )
            case "EnterReadEvent":
                return new EnterReadEvent(
                    json.timestamp,
                    this.processes[json.process],
                    json.fd,
                    json.count
                )
            case "ExitReadEvent":
                return new ExitReadEvent(
                    json.timestamp,
                    this.processes[json.process],
                    json.fd,
                    json.count,
                    json.content,
                    json.ret
                )
            case "WriteEvent":
                return new WriteEvent(
                    json.timestamp,
                    this.processes[json.process],
                    json.fd,
                    json.count,
                    json.content
                )
            
            default:
                console.error(`Unknown event type: ${json.event_type}`)
                return null
        }
    }


    static toJSON(trace: ExecutionTrace): string {

        const replacer = (key: string, value: any) => {

            if ( key === 'filename') {
                return undefined
            }

            if (key === 'process') {
                return trace.processes.map((process) => process.pid).indexOf(value.pid)
            }

            if (key === 'file') {
                return trace.files.map((file) => file.path).indexOf(value.path)
            }

            if (key === 'events') {
                return value.map((event: Event) => {
                    return { event_type: event.constructor.name, ...event }
                })

            }

            return value
        }

        const result = JSON.stringify(trace, replacer, 4)
        return result
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