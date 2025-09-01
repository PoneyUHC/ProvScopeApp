
import DataChunk from "./DataChunk";
import StorageStrategy from "./StrageStrategy/StorageStrategy";


export default class ResourceContent {

    storageStrategy: StorageStrategy;
    content: DataChunk[];


    constructor(content: DataChunk[], storageStrategy: StorageStrategy) {
        this.content = content;
        this.storageStrategy = storageStrategy;
    }

    addContent(newContent: DataChunk): void {
        this.storageStrategy.addContent(this.content, newContent);
    }

    getContent(size: number): DataChunk[] {
        return this.storageStrategy.getContent(this.content, size);
    }

    toString(): string {
        return this.content.map(chunk => chunk.data).join('');
    }
}