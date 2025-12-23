
import { ExecutionTrace } from "../ExecutionTrace";

export default abstract class ExecutionTraceImporterExtension {

    static getTag(): string | null { return "Not Implemented" }
    abstract importData(executionTrace: ExecutionTrace, json: JSON, extensionData: JSON | null): boolean
}