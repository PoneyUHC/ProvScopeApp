
import { Process, Event } from "@common/types";
import DataChunk from "../DataChunk";

import StorageStrategy from "./StorageStrategy";


const O_APPEND = 0x0400; // 1024
const O_TRUNC  = 0x0200; // 512

function hasFlag(flags: number, flag: number): boolean {
    return (flags & flag) === flag;
}


export default class FileStorageStrategy extends StorageStrategy {

    processCursorPositions: Map<[Process, number], number>;
    doesProcessAppend: Map<[Process, number], boolean>;

    constructor() {
        super();
        this.processCursorPositions = new Map<[Process, number], number>();
        this.doesProcessAppend = new Map<[Process, number], boolean>();
    }


    applyEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const eventTypeApplyers: { [key: string]: (event: Event, currentContent: DataChunk[]) => DataChunk[] } = {
            "OpenEvent": this.applyOpenEvent,
            "CloseEvent": this.applyCloseEvent,
            "WriteEvent": this.applyWriteEvent,
            "ExitReadEvent": this.applyExitReadEvent,
        };

        let newContent: DataChunk[] = currentContent;
        const applyEventFunction = eventTypeApplyers[event.eventType];
        if (applyEventFunction) {
            newContent = applyEventFunction(event, currentContent);
        } else {
            console.error(`FileStorageStrategy: No applyEvent implementation for event type ${event.eventType}`);
        }

        return newContent;
    }


    applyOpenEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        let newContent = currentContent;
        const key = [event.process, event.outputValues['fd']] as [Process, number];
        if (this.processCursorPositions.has(key)) {
            console.error("FileStorageStrategy: Cursor position already initialized for process and fd", key);
            return currentContent;
        }

        const flags = event.inputValues['flags']
        const truncActive  = hasFlag(flags, O_TRUNC);

        if (truncActive) {
            newContent = [];
        } 

        const appendActive = hasFlag(flags, O_APPEND);
        this.doesProcessAppend.set(key, appendActive);

        this.processCursorPositions.set(key, DataChunk.getSize(newContent));

        return newContent;
    }


    applyCloseEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const key = [event.process, event.inputValues['fd']] as [Process, number];
        if ( !this.processCursorPositions.has(key)) {
            console.error("FileStorageStrategy: trying to close a process / fd pair with no registered open event", key);
            return currentContent;
        }

        this.doesProcessAppend.delete(key);
        this.processCursorPositions.delete(key);

        return currentContent;
    }


    applyWriteEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        let newContent = currentContent;
        const key = [event.process, event.inputValues['fd']] as [Process, number];

        if ( this.doesProcessAppend.get(key) ) {
            // Append mode: move cursor to end before writing
            this.processCursorPositions.set(key, DataChunk.getSize(currentContent));
        }

        const cursorPosition = this.processCursorPositions.get(key);
        if ( cursorPosition === undefined ) {
            console.error("FileStorageStrategy: trying to write to a process / fd pair with no registered open event", key);
            return currentContent;
        }

        const requestedWriteContent = event.inputValues['content'] as string;
        const writtenSize = event.outputValues['ret'] as number;
        const writtenContent = requestedWriteContent.slice(0, writtenSize);

        newContent = this.addContent(currentContent, new DataChunk(writtenContent.length, writtenContent, event), cursorPosition);
        this.processCursorPositions.set(key, cursorPosition + writtenSize);

        return newContent;
    }


    addContent(currentContent: DataChunk[], newContent: DataChunk, cursorPosition: number): DataChunk[] {
        return DataChunk.insertAt(currentContent, newContent, cursorPosition);
    }

    getContent(currentContent: DataChunk[], size: number): DataChunk[] {
        if (size > currentContent.length) {
            throw new Error("Not enough content to retrieve");
        }
        return currentContent.slice(0, size);
    }
}