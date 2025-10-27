
import ExampleImporterExtension from "./ExampleImporterExtension";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";


export const importerExtensionsMapping: Map<string, ExecutionTraceImporterExtension> = new Map([
    ["EXT_example", new ExampleImporterExtension()],
]);