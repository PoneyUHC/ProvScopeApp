
import { Event } from "@common/types";

import DataChunk from "./DataChunk";
import StorageStrategy from "./StorageStrategy/StorageStrategy";
import { IClonable } from "@common/utils";


export default class ResourceContent implements IClonable<ResourceContent> {

    storageStrategy: StorageStrategy;
    content: DataChunk[];


    constructor(content: DataChunk[], storageStrategy: StorageStrategy) {
        this.content = content;
        this.storageStrategy = storageStrategy;
    }

    clone(): ResourceContent {
        const clonedContent = this.content.map(chunk => chunk.clone());
        return new ResourceContent(clonedContent, this.storageStrategy.clone());
    }


    applyEvent(event: Event): void {
        this.content = this.storageStrategy.applyEvent(event, this.content);
    }


    getContent(event: Event): DataChunk[] {
        return this.storageStrategy.getContent(event, this.content);
    }


    toString(): string {
        return this.content.map(chunk => chunk.data).join('');
    }
}