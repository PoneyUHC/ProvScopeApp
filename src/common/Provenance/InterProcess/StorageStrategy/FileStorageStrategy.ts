
import { Process, Event } from "@common/types";
import DataChunk from "../DataChunk";

import StorageStrategy from "./StorageStrategy";


const O_APPEND = 0x0400; // 1024
const O_TRUNC  = 0x0200; // 512

function hasFlag(flags: number, flag: number): boolean {
    return (flags & flag) === flag;
}


export default class FileStorageStrategy extends StorageStrategy {

    processCursorPositions: Map<string, number>;
    doesProcessAppend: Map<string, boolean>;

    constructor() {
        super();
        this.processCursorPositions = new Map<string, number>();
        this.doesProcessAppend = new Map<string, boolean>();
    }


    clone(): StorageStrategy {
        const cloned = new FileStorageStrategy();
        // Clone internal state
        this.processCursorPositions.forEach((value, key) => {
            cloned.processCursorPositions.set(key, value);
        });
        this.doesProcessAppend.forEach((value, key) => {
            cloned.doesProcessAppend.set(key, value);
        });
        return cloned;
    }


    getKey(process: Process, fd: number): string {
        return `${process.pid}-${fd}`;
    }
    

    applyEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const eventTypeApplyers: { [key: string]: (event: Event, currentContent: DataChunk[]) => DataChunk[] } = {
            "OpenEvent": this.applyOpenEvent.bind(this),
            "CloseEvent": this.applyCloseEvent.bind(this),
            "WriteEvent": this.applyWriteEvent.bind(this),
            "ExitReadEvent": this.applyExitReadEvent.bind(this),
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
        const key = this.getKey(event.process, event.outputValues['fd']);
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
        
        this.processCursorPositions.set(key, 0);

        return newContent;
    }


    applyCloseEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const key = this.getKey(event.process, event.inputValues['fd']);
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
        const key = this.getKey(event.process, event.inputValues['fd']);

        if ( this.doesProcessAppend.get(key) ) {
            // Append mode: move cursor to end before writing
            this.processCursorPositions.set(key, DataChunk.getSize(currentContent));
        }

        const cursorPosition = this.processCursorPositions.get(key);
        if ( cursorPosition === undefined ) {
            console.error("FileStorageStrategy: trying to write to a process / fd pair with no registered open event", key);
            return currentContent;
        }

        const requestedWriteContent = event.outputValues['content'] as string;
        const writtenSize = event.outputValues['ret'] as number;
        const writtenContent = requestedWriteContent.slice(0, writtenSize);

        const newChunk = new DataChunk(writtenContent, event);
        newContent = DataChunk.insertAt(currentContent, newChunk, cursorPosition);
        this.processCursorPositions.set(key, cursorPosition + writtenSize);

        return newContent;
    }


    applyExitReadEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const key = this.getKey(event.process, event.inputValues['fd']);
        if ( !this.processCursorPositions.has(key)) {
            console.error("FileStorageStrategy: trying to read from a process / fd pair with no registered open event", key);
            return currentContent;
        }

        const bytesRead = event.outputValues['ret'] as number;
        const cursorPosition = this.processCursorPositions.get(key)!;
        this.processCursorPositions.set(key, cursorPosition + bytesRead);

        return currentContent;
    }


    getContent(event: Event, currentContent: DataChunk[]): DataChunk[] {
        
        const key = this.getKey(event.process, event.inputValues['fd']);

        const cursorPosition = this.processCursorPositions.get(key);
        if ( cursorPosition === undefined ) {
            console.error("FileStorageStrategy: trying to read from a process / fd pair with no registered open event", key);
            return [];
        }
        
        let size = event.outputValues['ret'] as number;
        
        const result: DataChunk[] = []
        let startChunk = 0
        let currentPosition = 0
        while (startChunk < currentContent.length && currentPosition + currentContent[startChunk].size < cursorPosition) {
            currentPosition += currentContent[startChunk].size;
            startChunk++;
        }
        
        if (startChunk >= currentContent.length) {
            console.error("Cursor position exceeds content size");
            return [];
        }

        if (size > DataChunk.getSize(currentContent.slice(startChunk))) {
            console.error("Not enough content to retrieve");
            return [];
        }

        let readPosition = cursorPosition - currentPosition;
        const [_startChunk1, startChunk2] = currentContent[startChunk].getContent(readPosition);
        if (startChunk2) {
            if (startChunk2.size >= size) {
                const [gatheredChunk, _remainingChunk] = startChunk2.getContent(size);
                if (gatheredChunk) {
                    result.push(gatheredChunk);
                }
                return result;
            } else {
                result.push(startChunk2);
                size -= startChunk2.size;
            }
        }
        
        let currentChunkIndex = startChunk + 1;
        while (size > 0 && currentChunkIndex < currentContent.length) {
            const chunk = currentContent[currentChunkIndex];
            const readableSize = chunk.size
            if (size >= readableSize) {
                result.push(chunk);
                size -= readableSize;
            } else {
                const [gatheredChunk, _remainingChunk] = chunk.getContent(size);
                if (gatheredChunk) {
                    result.push(gatheredChunk);
                }
                size = 0;
            }
        }

        return result;
    }
}