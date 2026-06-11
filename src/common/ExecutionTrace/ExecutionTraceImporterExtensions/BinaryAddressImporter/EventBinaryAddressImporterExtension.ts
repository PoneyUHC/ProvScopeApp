
import { ExecutionTrace } from "../../ExecutionTrace";
import ExecutionTraceImporterExtension from "../ExecutionTraceImporterExtension";
import { UStackToCallsite } from "./UStackToCallsite";


export default class EventBinaryAddressImporterExtension implements ExecutionTraceImporterExtension {

    static getTag() : string | null {
        return "EXT_EVENT_USTACK"
    }

    importData(executionTrace: ExecutionTrace, json: JSON, _extensionData: JSON): boolean {
        console.log(`Executing ${EventBinaryAddressImporterExtension.name}`)

        for (let i=0; i < executionTrace.events.length; i++) {
            const event = executionTrace.events[i]
            const eventData = json["events"][i]
            if ( !eventData ) {
                console.warn(`${typeof EventBinaryAddressImporterExtension} failed: no event data for event with index ${i}`)
                continue
            }
            
            const ustack = eventData.ext_ustack
            if ( !ustack ) {
                console.warn(`${typeof EventBinaryAddressImporterExtension} failed: no ustack data for event with index ${i}`)
                continue
            }

            const symbolOffset = UStackToCallsite.getUserSymbolOffset(ustack)
            if ( !symbolOffset ) {
                event.hasUserCallsite = false
                continue
            }

            event.hasUserCallsite = true
            event.symbolOffset = symbolOffset
        }

        return true
    }
}