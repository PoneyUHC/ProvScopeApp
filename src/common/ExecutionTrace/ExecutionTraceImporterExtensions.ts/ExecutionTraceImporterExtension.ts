
import { ExecutionTrace } from "../ExecutionTrace";

export default abstract class ExecutionTraceImporterExtension {

    abstract importData(executionTrace: ExecutionTrace, json: JSON): void
}