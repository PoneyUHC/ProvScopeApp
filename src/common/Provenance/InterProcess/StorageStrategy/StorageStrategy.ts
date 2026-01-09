
import { Event } from "@common/types";
import { IClonable } from "@common/utils";

import DataChunk from "../DataChunk";


export default abstract class StorageStrategy implements IClonable<StorageStrategy> {

    abstract applyEvent(event: Event, currentContent: DataChunk[]): DataChunk[];
    abstract getContent(event: Event, currentContent: DataChunk[]): DataChunk[];
}