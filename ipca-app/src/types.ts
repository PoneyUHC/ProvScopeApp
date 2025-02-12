

export class IPCInstance {

    processes: Process[]
    files: File[]
    events: Event[]
    channels: Channel[]

    private constructor() {
        this.processes = []
        this.files = []
        this.events = []
    }


    static loadInstanceFromJSON(json: any) {

        const instance = new IPCInstance()

        for (const process of json.processes) {
            instance.processes.push(new Process(process.name, process.pid))   
        }

        for (const file of json.files) {
            instance.files.push(new File(file.name))
        }

        for (const jsonEvent of json.events) {
            const event = IPCInstance.createEventFromJSON(jsonEvent, instance)
            if ( event ) {
                instance.events.push(event)
            }
        }

        return instance
    }


    static createEventFromJSON(json: any, instance: IPCInstance): Event | null {

        switch (json.event_type) {
            case "OpenEvent":
                return new OpenEvent(
                    json.timestamp,
                    instance.processes[json.process],
                    instance.files[json.file],
                    json.fd,
                    json.mode,
                    json.flags
                )
            case "CloseEvent":
                return new CloseEvent(
                    json.timestamp,
                    instance.processes[json.process],
                    json.fd
                )
            case "EnterReadEvent":
                return new EnterReadEvent(
                    json.timestamp,
                    instance.processes[json.process],
                    json.fd,
                    json.count
                )
            case "ExitReadEvent":
                return new ExitReadEvent(
                    json.timestamp,
                    instance.processes[json.process],
                    json.fd,
                    json.count,
                    json.content,
                    json.ret
                )
            case "WriteEvent":
                return new WriteEvent(
                    json.timestamp,
                    instance.processes[json.process],
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


export class Process {

    name: string
    pid: number

    constructor(name: string, pid: number) {
        this.name = name
        this.pid = pid
    }

    getUUID(): string {
        return `${this.name}-${this.pid}`
    }
}


export class File {

    name: string

    constructor(name: string) {
        this.name = name
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


export class OpenEvent extends Event {

    file: File
    fd: number
    mode: number
    flags: number

    constructor(timestamp: number, process: Process, file: File, fd: number, mode: number, flags: number) {
        super(timestamp, process)
        this.file = file
        this.fd = fd
        this.mode = mode
        this.flags = flags
    }

    getKeyword(): string {
        return "opens"
    }
}


export class CloseEvent extends Event {

    fd: number

    constructor(timestamp: number, process: Process, fd: number) {
        super(timestamp, process)
        this.fd = fd
    }

    getKeyword(): string {
        return "closes"
    }
}


export class EnterReadEvent extends Event {

    fd: number
    count: number

    constructor(timestamp: number, process: Process, fd: number, count: number) {
        super(timestamp, process)
        this.fd = fd
        this.count = count
    }

    getKeyword(): string {
        return "enters read"
    }
}


export class ExitReadEvent extends Event {

    fd: number
    count: number
    content: string
    ret: number

    constructor(timestamp: number, process: Process, fd: number, count: number, content: string, ret: number) {
        super(timestamp, process)
        this.fd = fd
        this.count = count
        this.content = content
        this.ret = ret
    }

    getKeyword(): string {
        return "exits read"
    }
}


export class WriteEvent extends Event {

    fd: number
    count: number
    content: string

    constructor(timestamp: number, process: Process, fd: number, count: number, content: string) {
        super(timestamp, process)
        this.fd = fd
        this.count = count
        this.content = content
    }

    getKeyword(): string {
        return "writes"
    }
}