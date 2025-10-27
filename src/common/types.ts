
import { IClonable } from "@common/utils"


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


export class Resource {

    resourceType: ResourceType
    path: string

    constructor(path: string, resourceType: ResourceType) {
        this.path = path
        this.resourceType = resourceType
    }

    clone(): Resource {
        return new Resource(this.path, this.resourceType)
    }
}


export enum ResourceType {
    FIFO = 0,
    CHAR_DEVICE = 1,
    DIRECTORY = 2,
    BLOCK_DEVICE = 3,
    REGULAR_FILE = 4,
    SYMLINK = 5,
    SOCKET = 6,
    UNKNOWN = 7
}


export abstract class Event {

    timestamp: number
    process: Process
    eventType: string
    id: number
    address: string | null

    constructor(timestamp: number, process: Process) {
        this.timestamp = timestamp
        this.process = process
        this.eventType = this.constructor.name
        this.id = -1 // Placeholder for unique ID, can be set later
        this.address = "00100498"
    }

    getObjectName(): string {
        return this.process.getUUID()
    }

    abstract getDescription(): string

    abstract getKeyword(): string
}


export abstract class FSEvent extends Event {

    fd: number
    filepath: string

    constructor(timestamp: number, process: Process, fd: number) {
        super(timestamp, process)
        this.fd = fd
        this.filepath = "TBD" // Placeholder, can be set later
    }

    getDescription() {
        const processUUID = this.process.getUUID();
        return `${processUUID} ${this.getKeyword()} ${this.filepath}`
    }
}


export class OpenEvent extends FSEvent {

    file: Resource
    mode: number
    flags: number

    constructor(timestamp: number, process: Process, file: Resource, fd: number, mode: number, flags: number) {
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
