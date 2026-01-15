
import { ExecutionTrace } from "../ExecutionTrace";
import ExecutionTraceImporterExtension from "./ExecutionTraceImporterExtension";


export default class EventColorsImporterExtension implements ExecutionTraceImporterExtension {

    static getTag() : string | null {
        return "EXT_EVENT_COLOR"
    }

    importData(executionTrace: ExecutionTrace, _json: JSON, extensionData: JSON): boolean {
        console.log(`Executing ${EventColorsImporterExtension.name}`)

        const colorData = extensionData
        if (!colorData) {
            console.warn(`${typeof EventColorsImporterExtension} failed: no color data in given json`)
            return false
        }

        const events = executionTrace.events
        for (const event of events) {
            const eventType = event.eventType
            const color = colorData[eventType]
            if (!color) {
                console.warn(`${typeof EventColorsImporterExtension} failed: no color data for event type ${eventType}`)
            }
            event.color = color
        }

        return true
    }
}