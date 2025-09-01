
import DataChunk from "../DataChunk";

import StorageStrategy from "./StorageStrategy";


export default class FileStorageStrategy extends StorageStrategy {

    constructor() {
        super();
    }

    //TODO: implement behavior relative to opening mode (append, overwrite, etc.)
    // It should also remember the current cursor position (maybe on processs' side ?)

    addContent(currentContent: DataChunk[], newContent: DataChunk): void {
        currentContent.push(newContent);
    }

    getContent(currentContent: DataChunk[], size: number): DataChunk[] {
        if (size > currentContent.length) {
            throw new Error("Not enough content to retrieve");
        }
        return currentContent.slice(0, size);
    }
}