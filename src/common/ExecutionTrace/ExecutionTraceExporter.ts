
import { ExecutionTrace } from "./ExecutionTrace"


export default class ExecutionTraceExporter {

    static toJSON(trace: ExecutionTrace): string {
        const replacer = (key: string, value: any) => {

            if ( key === 'filename') {
                return undefined
            }

            if (key === 'process') {
                return trace.processes.map((process) => process.pid).indexOf(value.pid)
            }

            if (key === 'file') {
                return trace.files.map((file) => file.path).indexOf(value.path)
            }

            if (key === 'events') {
                return value.map((event: Event) => {
                    return { event_type: event.constructor.name, ...event }
                })

            }

            return value
        }

        const result = JSON.stringify(trace, replacer, 4)
        return result
    }
}