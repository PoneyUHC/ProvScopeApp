
import { IClonable } from "./utils"


export class IPCTrace implements IClonable<IPCTrace> {

    filename: string

    processes: Process[]
    files: File[]
    channels: string[]
    events: Event[]

    constructor() {
        this.filename = ""
        this.processes = []
        this.files = []
        this.channels = []
        this.events = []
    }


    static createInstanceFromJSON(filename: string, json: any) {

        const instance = new IPCTrace()

        instance.filename = filename

        for (const process of json.processes) {
            instance.processes.push(new Process(process.name, process.pid))   
        }

        for (const file of json.files) {
            instance.files.push(new File(file.path))
        }

        for( const channel of json.channels) {
            instance.channels.push(channel)
        }

        for (const jsonEvent of json.events) {
            const event = IPCTrace.createEventFromJSON(jsonEvent, instance)
            if ( event ) {
                instance.events.push(event)
            }
        }

        return instance
    }


    private static createEventFromJSON(json: any, trace: IPCTrace): Event | null {

        switch (json.event_type) {
            case "OpenEvent":
                return new OpenEvent(
                    json.timestamp,
                    trace.processes[json.process],
                    trace.files[json.file],
                    json.fd,
                    json.mode,
                    json.flags
                )
            case "CloseEvent":
                return new CloseEvent(
                    json.timestamp,
                    trace.processes[json.process],
                    json.fd
                )
            case "EnterReadEvent":
                return new EnterReadEvent(
                    json.timestamp,
                    trace.processes[json.process],
                    json.fd,
                    json.count
                )
            case "ExitReadEvent":
                return new ExitReadEvent(
                    json.timestamp,
                    trace.processes[json.process],
                    json.fd,
                    json.count,
                    json.content,
                    json.ret
                )
            case "WriteEvent":
                return new WriteEvent(
                    json.timestamp,
                    trace.processes[json.process],
                    json.fd,
                    json.count,
                    json.content
                )
            
            default:
                console.error(`Unknown event type: ${json.event_type}`)
                return null
        }
    }


    static toJSON(ipcTrace: IPCTrace): string {

        const replacer = (key: string, value: any) => {

            if ( key === 'filename') {
                return undefined
            }

            if (key === 'process') {
                return ipcTrace.processes.map((process) => process.pid).indexOf(value.pid)
            }

            if (key === 'file') {
                return ipcTrace.files.map((file) => file.path).indexOf(value.path)
            }

            if (key === 'events') {
                return value.map((event: Event) => {
                    return { event_type: event.constructor.name, ...event }
                })

            }

            return value
        }

        const result = JSON.stringify(ipcTrace, replacer, 4)
        return result
    }


    clone(): IPCTrace {
        const clone = new IPCTrace()
        clone.filename = this.filename
        clone.processes = this.processes.map((process) => process.clone())
        clone.files = this.files.map((file) => file.clone())
        clone.events = [...this.events]
        return clone
    }

}


export class Process implements IClonable<Process> {

    name: string
    pid: number

    constructor(name: string, pid: number) {
        this.name = name
        this.pid = pid
    }

    getUUID (): string {
        return `${this.name}-${this.pid}`
    }

    clone(): Process {
        return new Process(this.name, this.pid)
    }
}


export class File {

    path: string
    constructor(path: string) {
        this.path = path
    }

    clone(): File {
        return new File(this.path)
    }
}


export abstract class Event {

    timestamp: number
    process: Process

    constructor(timestamp: number, process: Process) {
        this.timestamp = timestamp
        this.process = process
    }

    abstract getKeyword(): string
}


export abstract class FSEvent extends Event {

    fd: number

    constructor(timestamp: number, process: Process, fd: number) {
        super(timestamp, process)
        this.fd = fd
    }

    clone(): FSEvent {
        throw new Error("Method not implemented.")
    }
}


export class OpenEvent extends FSEvent {

    file: File
    mode: number
    flags: number

    constructor(timestamp: number, process: Process, file: File, fd: number, mode: number, flags: number) {
        super(timestamp, process, fd)
        this.file = file
        this.mode = mode
        this.flags = flags
    }

    getKeyword(): string {
        return "opens"
    }
}


export class CloseEvent extends FSEvent {

    constructor(timestamp: number, process: Process, fd: number) {
        super(timestamp, process, fd)
    }

    getKeyword(): string {
        return "closes"
    }
}


export class EnterReadEvent extends FSEvent {

    count: number

    constructor(timestamp: number, process: Process, fd: number, count: number) {
        super(timestamp, process, fd)
        this.count = count
    }

    getKeyword(): string {
        return "enters read"
    }
}


export class ExitReadEvent extends FSEvent {

    count: number
    content: string
    ret: number

    constructor(timestamp: number, process: Process, fd: number, count: number, content: string, ret: number) {
        super(timestamp, process, fd)
        this.count = count
        this.content = content
        this.ret = ret
    }

    getKeyword(): string {
        return "exits read"
    }
}


export class WriteEvent extends FSEvent {

    count: number
    content: string

    constructor(timestamp: number, process: Process, fd: number, count: number, content: string) {
        super(timestamp, process, fd)
        this.count = count
        this.content = content
    }

    getKeyword(): string {
        return "writes"
    }
}
