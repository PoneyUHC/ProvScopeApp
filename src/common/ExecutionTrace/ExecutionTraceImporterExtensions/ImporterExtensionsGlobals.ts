
import EventColorsImporterExtension from "./EventColorsImporterExtension";
import EdgeDirectionStrategyOverwriteExtension from "./EdgeDirectionStrategyOverwriteExtension";
import EventMergerImporterExtension from "./EventMergerImporterExtension";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";
import EventSplitterImporterExtension from "./EventSplitterImporterExtension";
import EventBinaryAddressImporterExtension from "./BinaryAddressImporter/EventBinaryAddressImporterExtension";
import EventFilterImporterExtension from "./EventFilterImporterExtension";


export const tagToImporterMapping = new Map<string, ExecutionTraceImporterExtension>([
    [EventColorsImporterExtension.getTag()!, new EventColorsImporterExtension()],
    [EventBinaryAddressImporterExtension.getTag()!, new EventBinaryAddressImporterExtension()]
])


export const staticExtensions: ExecutionTraceImporterExtension[] = [
    new EventMergerImporterExtension(),
    new EventSplitterImporterExtension(),
    new EdgeDirectionStrategyOverwriteExtension(),
    new EventFilterImporterExtension()
]

