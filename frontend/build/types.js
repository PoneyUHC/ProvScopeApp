export class IPCInstance {
    constructor() {
        Object.defineProperty(this, "filename", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "processes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "files", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.filename = "";
        this.processes = [];
        this.files = [];
        this.events = [];
    }
    static loadInstanceFromJSON(filename, json) {
        const instance = new IPCInstance();
        instance.filename = filename;
        for (const process of json.processes) {
            instance.processes.push(new Process(process.name, process.pid));
        }
        for (const file of json.files) {
            instance.files.push(new File(file.path));
        }
        for (const jsonEvent of json.events) {
            const event = IPCInstance.createEventFromJSON(jsonEvent, instance);
            if (event) {
                instance.events.push(event);
            }
        }
        return instance;
    }
    static createEventFromJSON(json, instance) {
        switch (json.event_type) {
            case "OpenEvent":
                return new OpenEvent(json.timestamp, instance.processes[json.process], instance.files[json.file], json.fd, json.mode, json.flags);
            case "CloseEvent":
                return new CloseEvent(json.timestamp, instance.processes[json.process], json.fd);
            case "EnterReadEvent":
                return new EnterReadEvent(json.timestamp, instance.processes[json.process], json.fd, json.count);
            case "ExitReadEvent":
                return new ExitReadEvent(json.timestamp, instance.processes[json.process], json.fd, json.count, json.content, json.ret);
            case "WriteEvent":
                return new WriteEvent(json.timestamp, instance.processes[json.process], json.fd, json.count, json.content);
            default:
                console.error(`Unknown event type: ${json.event_type}`);
                return null;
        }
    }
    static exportToJSON(ipcInstance) {
        const replacer = (key, value) => {
            if (key === 'filename') {
                return undefined;
            }
            if (key === 'process') {
                return ipcInstance.processes.map((process) => process.pid).indexOf(value.pid);
            }
            if (key === 'file') {
                return ipcInstance.files.map((file) => file.path).indexOf(value.path);
            }
            if (key === 'events') {
                return value.map((event) => {
                    return { event_type: event.constructor.name, ...event };
                });
            }
            return value;
        };
        const json = JSON.stringify(ipcInstance, replacer, 4);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filenameParts = ipcInstance.filename.split('.');
        const filenamePrefix = filenameParts[0];
        const extension = filenameParts[1];
        a.download = `${filenamePrefix}_exported.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    clone() {
        const clone = new IPCInstance();
        clone.filename = this.filename;
        clone.processes = structuredClone(this.processes);
        clone.files = structuredClone(this.files);
        clone.events = [...this.events];
        return clone;
    }
}
export class Process {
    constructor(name, pid) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = name;
        this.pid = pid;
    }
    getUUID() {
        return `${this.name}-${this.pid}`;
    }
}
export class File {
    constructor(path) {
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.path = path;
    }
}
export class Event {
    constructor(timestamp, process) {
        Object.defineProperty(this, "timestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "process", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.timestamp = timestamp;
        this.process = process;
    }
}
export class FSEvent extends Event {
    constructor(timestamp, process, fd) {
        super(timestamp, process);
        Object.defineProperty(this, "fd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.fd = fd;
    }
    clone() {
        throw new Error("Method not implemented.");
    }
}
export class OpenEvent extends FSEvent {
    constructor(timestamp, process, file, fd, mode, flags) {
        super(timestamp, process, fd);
        Object.defineProperty(this, "file", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "flags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.file = file;
        this.mode = mode;
        this.flags = flags;
    }
    getKeyword() {
        return "opens";
    }
}
export class CloseEvent extends FSEvent {
    constructor(timestamp, process, fd) {
        super(timestamp, process, fd);
    }
    getKeyword() {
        return "closes";
    }
}
export class EnterReadEvent extends FSEvent {
    constructor(timestamp, process, fd, count) {
        super(timestamp, process, fd);
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.count = count;
    }
    getKeyword() {
        return "enters read";
    }
}
export class ExitReadEvent extends FSEvent {
    constructor(timestamp, process, fd, count, content, ret) {
        super(timestamp, process, fd);
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.count = count;
        this.content = content;
        this.ret = ret;
    }
    getKeyword() {
        return "exits read";
    }
}
export class WriteEvent extends FSEvent {
    constructor(timestamp, process, fd, count, content) {
        super(timestamp, process, fd);
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.count = count;
        this.content = content;
    }
    getKeyword() {
        return "writes";
    }
}
