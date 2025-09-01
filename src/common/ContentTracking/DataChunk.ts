
import { IClonable } from "@common/utils";


export default class DataChunk implements IClonable<DataChunk> {

    size: number;
    data: Uint8Array;
    originEvent: Event;

    constructor(size: number, data: Uint8Array, originEvent: Event) {
        this.size = size;
        this.data = data;
        this.originEvent = originEvent;
    }

    clone(): DataChunk {
        return new DataChunk(this.size, this.data.slice(), this.originEvent);
    }

    static getSize(chunks: DataChunk[]): number {
        return chunks.reduce((acc, chunk) => acc + chunk.size, 0);
    }

    getContent(size: number): [DataChunk, DataChunk | null] {
        if (size >= this.size) {
            return [this, null]
        }

        const gatheredData = this.data.slice(0, size);
        const remainingSize = this.size - size;
        const remainingData = this.data.slice(size);
        const gatheredChunk = new DataChunk(size, gatheredData, this.originEvent);
        const remainingChunk = new DataChunk(remainingSize, remainingData, this.originEvent);
        return [gatheredChunk, remainingChunk];
    }

    toString(): string {
        return this.data.toString();
    }
}