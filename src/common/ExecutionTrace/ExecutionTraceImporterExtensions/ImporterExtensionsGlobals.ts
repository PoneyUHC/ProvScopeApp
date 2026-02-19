
import EventColorsImporterExtension from "./EventColorsImporterExtension";
import EdgeDirectionStrategyOverwriteExtension from "./EdgeDirectionStrategyOverwriteExtension";
import EventMergerImporterExtension from "./EventMergerImporterExtension";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";
import EventSplitterImporterExtension from "./EventSplitterImporterExtension";


export const tagToImporterMapping = new Map<string, ExecutionTraceImporterExtension>([
    [EventColorsImporterExtension.getTag()!, new EventColorsImporterExtension()],
])


export const staticExtensions: ExecutionTraceImporterExtension[] = [
    new EventMergerImporterExtension(),
    new EventSplitterImporterExtension(),
    new EdgeDirectionStrategyOverwriteExtension()
]

