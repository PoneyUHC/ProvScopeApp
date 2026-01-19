
import { Event } from "@common/types";

import DataChunk from "../DataChunk";

import StorageStrategy from "./StorageStrategy";


export default class FIFOStorageStrategy extends StorageStrategy {

    constructor() {
        super();
    }


    // no internal state to clone, dummy clone
    clone(): StorageStrategy {
        return new FIFOStorageStrategy();
    }


    applyEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const eventTypeApplyers: { [key: string]: (event: Event, currentContent: DataChunk[]) => DataChunk[] } = {
            "OpenEvent": (_e, c) => c,
            "CloseEvent": (_e, c) => c,
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


    applyWriteEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        const data = event.outputValues['content'] as string;
        const writtenSize = event.outputValues['ret'] as number;
        
        const dataToWrite = data.slice(0, writtenSize);

        const newChunk = new DataChunk(dataToWrite, event);
        const newContent = [...currentContent, newChunk];
        
        return newContent;
    }


    applyExitReadEvent(event: Event, currentContent: DataChunk[]): DataChunk[] {

        let size = event.outputValues['ret'] as number;

        if (size > DataChunk.getSize(currentContent)) {
            console.error("Not enough content to retrieve");
            console.error(event)
            console.error(currentContent)
            return [];
        }

        this.internalGetContent(event, currentContent, true);

        return currentContent;
    }


    internalGetContent(event: Event, currentContent: DataChunk[], shouldModify: boolean): DataChunk[] {

        let result: DataChunk[] = []
        let size = event.outputValues['ret'] as number;

        if (size > DataChunk.getSize(currentContent)) {
            console.error("Not enough content to retrieve");
            return [];
        }

        let position = 0
        while (size > 0) {
            const chunk = currentContent[position];
            if (chunk.size <= size) {
                size -= chunk.size;
                position += 1
                if (shouldModify) {
                    currentContent.shift();
                    position -= 1;    
                }
                result.push(chunk);
            } else {
                const [gatheredChunk, remainingChunk] = chunk.getContent(size);
                if (gatheredChunk) {
                    result.push(gatheredChunk);
                }

                if (shouldModify && remainingChunk) {
                    currentContent[0] = remainingChunk;
                }

                size = 0
            }
        }

        return result;
    }


    getContent(event: Event, currentContent: DataChunk[]): DataChunk[] {
        
        let result: DataChunk[] = []

        result = this.internalGetContent(event, currentContent, false);

        return result;
    }
}
