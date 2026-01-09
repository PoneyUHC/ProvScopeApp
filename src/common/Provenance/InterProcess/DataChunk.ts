
import { IClonable } from "@common/utils";
import { Event } from "@common/types";


export default class DataChunk implements IClonable<DataChunk> {

    data: string;
    originEvent: Event;


    constructor(data: string, originEvent: Event) {
        this.data = data;
        this.originEvent = originEvent;
    }


    clone(): DataChunk {
        return new DataChunk(this.data.slice(), this.originEvent);
    }


    toString(): string {
        return this.data.toString();
    }


    static getSize(chunks: DataChunk[]): number {
        return chunks.reduce((acc, chunk) => acc + chunk.size, 0);
    }


    get size(): number {
        return this.data.length;
    }


    getContent(requestedSize: number): [DataChunk | null, DataChunk | null] {

        const currentSize = this.data.length;
        if (requestedSize <= 0) {
            return [null, this];
        }

        if (requestedSize >= currentSize) {
            return [this, null]
        }

        const gatheredData = this.data.slice(0, requestedSize);
        const gatheredChunk = new DataChunk(gatheredData, this.originEvent);

        const remainingData = this.data.slice(requestedSize);
        const remainingChunk = new DataChunk(remainingData, this.originEvent);

        return [gatheredChunk, remainingChunk];
    }


    static insertAt(chunks: DataChunk[], newChunk: DataChunk, position: number): DataChunk[] {
     
        let startChunkIndex = 0;
        let startAccumulatedSize = 0;

        while (startChunkIndex < chunks.length && startAccumulatedSize + chunks[startChunkIndex].size <= position) {
            startAccumulatedSize += chunks[startChunkIndex].size;
            startChunkIndex++;
        }

        const priorChunks = chunks.slice(0, startChunkIndex);

        if (startChunkIndex === chunks.length) {
            const priorSpace = position - startAccumulatedSize;
            if (priorSpace > 0) {
                const paddingChunk = new DataChunk('\0'.repeat(priorSpace), newChunk.originEvent);
                return [...chunks, paddingChunk, newChunk];
            } else {
                return [...chunks, newChunk];
            }
        }

        let endChunkIndex = startChunkIndex;
        let endAccumulatedSize = startAccumulatedSize;

        while (endChunkIndex < chunks.length && endAccumulatedSize < position + newChunk.size) {
            endAccumulatedSize += chunks[endChunkIndex].size;
            endChunkIndex++;
        }

        const positionInStartChunk = position - startAccumulatedSize;
        const [startChunk1, _startChunk2] = chunks[startChunkIndex].getContent(positionInStartChunk);

        if (endChunkIndex === chunks.length) {
            const endChunk = chunks[endChunkIndex - 1];
            const remainingInEndChunk = endAccumulatedSize - (position + newChunk.size);
            const consumedInEndChunk = endChunk.size - remainingInEndChunk;
            const [_endChunk1, endChunk2] = endChunk.getContent(consumedInEndChunk);

            return [
                ...priorChunks,
                ...(startChunk1 ? [startChunk1] : []),
                newChunk,
                ...(endChunk2 ? [endChunk2] : [])
            ]
        }

        const followingChunks = chunks.slice(endChunkIndex);
        const endChunk = chunks[endChunkIndex - 1];
        const remainingInEndChunk = endAccumulatedSize - (position + newChunk.size);
        const consumedInEndChunk = endChunk.size - remainingInEndChunk;
        const [_endChunk1, endChunk2] = endChunk.getContent(consumedInEndChunk);

        return [
            ...priorChunks,
            ...(startChunk1 ? [startChunk1] : []),
            newChunk,
            ...(endChunk2 ? [endChunk2] : []),
            ...followingChunks
        ]
    }
}