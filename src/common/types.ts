
import { IClonable } from "@common/utils"


export abstract class Entity implements IClonable<Entity> {

    abstract getUUID(): string
    abstract clone(): Entity
}


export class Process implements Entity {

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


export class Resource implements Entity {

    resourceType: ResourceType
    path: string

    constructor(path: string, resourceType: ResourceType) {
        this.path = path
        this.resourceType = resourceType
    }

    getUUID (): string {
        return this.path
    }

    clone(): Resource {
        return new Resource(this.path, this.resourceType)
    }
}


export class Event {

    timestamp: number
    process: Process
    eventType: string

    otherEntities: Set<Entity>
    sourceEntities: Set<Entity>
    targetEntities: Set<Entity>
    inputValues: Record<string, any>
    outputValues: Record<string, any>

    description: string
    id: number
    address: string | null

    constructor(
        timestamp: number, 
        process: Process, 
        eventType: string, 
        otherEntities: Set<Entity>, 
        sourceEntities: Set<Entity>, 
        targetEntities: Set<Entity>, 
        inputValues: Record<string, any>, 
        outputValues: Record<string, any>,
        description: string
    ) {
        this.timestamp = timestamp
        this.process = process
        this.eventType = eventType

        this.otherEntities = otherEntities
        this.sourceEntities = sourceEntities
        this.targetEntities = targetEntities
        this.inputValues = inputValues
        this.outputValues = outputValues


        this.description = description

        this.id = -1 // Placeholder for unique ID, can be set later

        // EXT_ADDR placeholder
        this.address = "deadbeef"
    }
}
