
import DataChunk from "../DataChunk";


export default abstract class StorageStrategy {

    abstract addContent(currentContent: DataChunk[], newContent: DataChunk): void;
    abstract getContent(currentContent: DataChunk[], size: number): DataChunk[];
}