
import { EdgeDirectionStrategy } from "@common/types";
import { ExecutionTrace } from "../ExecutionTrace";

export default class EdgeDirectionStrategyOverwriteExtensionn {

    static getTag(): string | null {
        return null
    }

    importData(executionTrace: ExecutionTrace, _json: JSON, _extensionData: JSON | null): boolean {

        const events = executionTrace.events
        for (const event of events) {
            if (event.eventType === "ExitReadEvent") {
                event.edgeDirection = EdgeDirectionStrategy.OTHERS_TO_PROCESS
            } else if (event.eventType === "WriteEvent") {
                event.edgeDirection = EdgeDirectionStrategy.PROCESS_TO_OTHERS
            } else if (event.eventType === "OpenEvent") {
                event.edgeDirection = EdgeDirectionStrategy.OTHERS_TO_PROCESS
            }
        }

        return true
    }
}