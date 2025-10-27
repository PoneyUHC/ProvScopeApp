
import { ExecutionTrace } from "../ExecutionTrace";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";


export default class ExampleImporterExtension implements ExecutionTraceImporterExtension {

    importData(_executionTrace: ExecutionTrace, _json: JSON): void {
        console.log("Example importer extension that does nothing")
    }
}