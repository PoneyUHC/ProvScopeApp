
import EventColorsImporterExtension from "./EventColorsImporterExtension";
import EventMergerImporterExtension from "./EventMergerImporterExtension";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";


export const tagToImporterMapping = new Map<string, ExecutionTraceImporterExtension>([
    [EventColorsImporterExtension.getTag()!, new EventColorsImporterExtension()],
])


export const staticExtensions: ExecutionTraceImporterExtension[] = [
    new EventMergerImporterExtension()
]

