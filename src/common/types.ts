
import { IClonable } from "@common/utils"
import { ProgramFile } from "@common/ProgramFile"


export abstract class Entity implements IClonable<Entity> {

    abstract getUUID(): string
    abstract clone(): Entity
}


export class Process implements Entity {

    name: string
    pid: number
    programFile: ProgramFile | null

    constructor(name: string, pid: number) {
        this.name = name
        this.pid = pid
        this.programFile = null
    }

    getUUID (): string {
        return `${this.name}-${this.pid}`
    }

    clone(): Process {
        const clone = new Process(this.name, this.pid)
        clone.programFile = this.programFile
        return clone
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

    // UUID <> Resource bank, holding every registered resource under its UUID
    private static uuidBank: Map<string, Resource> = new Map()

    resourceType: ResourceType
    path: string
    uuid: string

    constructor(path: string, resourceType: ResourceType) {
        this.path = path
        this.resourceType = resourceType
        this.uuid = "" // assigned by register()
        Resource.register(this)
    }

    // Number of segments in a path, i.e. the deepest suffix it can produce
    private static depthOf(path: string): number {
        return path.split('/').length
    }

    // The last `depth` segments of `path`, clamped to what the path can offer
    private static suffixOf(path: string, depth: number): string {
        const segments = path.split('/')
        const clamped = Math.min(Math.max(depth, 1), segments.length)
        return segments.slice(segments.length - clamped).join('/')
    }

    // A suffix is ambiguous as soon as another registered path also ends with it,
    // whether or not that path currently uses it as its UUID
    private static isAmbiguous(suffix: string, resource: Resource): boolean {
        for (const other of Resource.uuidBank.values()) {
            if (other.path === resource.path) {
                continue // same path means same resource, not a collision
            }
            if (other.path === suffix || other.path.endsWith(`/${suffix}`)) {
                return true
            }
        }
        return false
    }

    // Gives `resource` the shortest suffix of its path that no other path ends with,
    // then rebanks it under that UUID
    private static assignUUID(resource: Resource): void {
        const maxDepth = Resource.depthOf(resource.path)
        let uuid = resource.path // fallback: no suffix is unambiguous, spell the path out

        for (let depth = 1; depth <= maxDepth; depth++) {
            const suffix = Resource.suffixOf(resource.path, depth)
            if (!Resource.isAmbiguous(suffix, resource)) {
                uuid = suffix
                break
            }
        }

        if (Resource.uuidBank.get(resource.uuid) === resource) {
            Resource.uuidBank.delete(resource.uuid)
        }
        const displaced = Resource.uuidBank.get(uuid)
        resource.uuid = uuid
        Resource.uuidBank.set(uuid, resource)

        // Taking a UUID over happens when a path is the exact suffix of a longer one:
        // the longer path has to give it up and spell out one more segment
        if (displaced !== undefined && displaced.path !== resource.path) {
            Resource.assignUUID(displaced)
        }
    }

    // Banks the newcomer, then lengthens the UUID of the already banked resources it
    // collides with. Only resources sharing its filename can collide, since every
    // candidate UUID ends on the filename.
    private static register(resource: Resource): void {
        const filename = Resource.suffixOf(resource.path, 1)
        const collided = Array.from(Resource.uuidBank.values()).filter((other) =>
            other.path !== resource.path && Resource.suffixOf(other.path, 1) === filename
        )

        Resource.assignUUID(resource)
        collided.forEach((other) => Resource.assignUUID(other))
    }

    getUUID (): string {
        return this.uuid
    }

    clone(): Resource {
        return new Resource(this.path, this.resourceType)
    }
}


export enum EdgeDirectionStrategy {
    SOURCES_TO_TARGETS,
    PROCESS_TO_OTHERS,
    OTHERS_TO_PROCESS,
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

    hasUserCallsite: boolean
    symbolOffset: string
    address: string
    
    color: string
    edgeDirection: EdgeDirectionStrategy

    constructor(
        timestamp: number, 
        process: Process, 
        eventType: string,
        sourceEntities: Set<Entity>, 
        targetEntities: Set<Entity>, 
        inputValues: Record<string, any>, 
        outputValues: Record<string, any>,
        description: string
    ) {
        this.timestamp = timestamp
        this.process = process
        this.eventType = eventType

        this.otherEntities = sourceEntities.union(targetEntities).difference(new Set([process]))
        this.sourceEntities = sourceEntities
        this.targetEntities = targetEntities
        this.inputValues = inputValues
        this.outputValues = outputValues


        this.description = description

        this.id = -1 // Placeholder for unique ID, can be set later

        // EXT_ADDR placeholder
        this.hasUserCallsite = false
        this.symbolOffset = "no_user_code"
        this.address = "0xdeadbeef"

        // EXT_EVENT_COLOR placeholder
        this.color = "black"

        this.edgeDirection = EdgeDirectionStrategy.SOURCES_TO_TARGETS
    }
}
