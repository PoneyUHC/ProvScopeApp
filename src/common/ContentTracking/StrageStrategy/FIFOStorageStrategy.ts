
import DataChunk from "../DataChunk";

import StorageStrategy from "./StorageStrategy";


export default class FIFOStorageStrategy extends StorageStrategy {

    constructor() {
        super();
    }


    addContent(currentContent: DataChunk[], newContent: DataChunk): void {
        currentContent.push(newContent);
    }

    getContent(currentContent: DataChunk[], size: number): DataChunk[] {

        const result: DataChunk[] = []

        if (size > DataChunk.getSize(currentContent)) {
            console.error("Not enough content to retrieve");
            return [];
        }

        while (size > 0) {
            const chunk = currentContent[0]
            if (chunk.size <= size) {
                size -= chunk.size;
                currentContent.shift();
                result.push(chunk);
            } else {
                const [gatheredChunk, remainingChunk] = chunk.getContent(size);
                if (remainingChunk) {
                    currentContent[0] = remainingChunk
                }
                result.push(gatheredChunk);
            }
        }

        return result;
    }
}
