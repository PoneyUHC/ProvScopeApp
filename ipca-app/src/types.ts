
class Process {

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


class File {

    name: string

    constructor(name: string) {
        this.name = name
    }
}


abstract class Event {

    timestamp: number
    process: Process

    constructor(timestamp: number, process: Process) {
        this.timestamp = timestamp
        this.process = process
    }

    abstract getKeyword(): string
}


class OpenEvent extends Event {

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


class CloseEvent extends Event {

    fd: number

    constructor(timestamp: number, process: Process, fd: number) {
        super(timestamp, process)
        this.fd = fd
    }

    getKeyword(): string {
        return "closes"
    }
}


class EnterReadEvent extends Event {

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


class ExitReadEvent extends Event {

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


class WriteEvent extends Event {

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