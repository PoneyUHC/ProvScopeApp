
import React, { useEffect, useState } from 'react';

import DataflowGraphPanel from '@renderer/components/DataflowGraphPanel/DataflowGraphPanel';
import { ExecutionTrace } from '@common/types';
import DataflowGraph from '@common/DataflowGraph';


const DataflowGraphView: React.FC = () => {

    const [trace, setTrace] = useState<ExecutionTrace | null>(null)
    const [dataflowGraph, setDataflowGraph] = useState<DataflowGraph | null>(null)

        
    const loadTrace = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`)
        const json = JSON.parse(content)
        const trace = ExecutionTrace.createInstanceFromJSON(filename, json)
        setTrace(trace)
    }


    useEffect(() => {
        window.api.onLoadTrace( loadTrace )

        return () => {
            // FIXME: callback being updated each time, a simple off for specific events does no work
            // as the callback is not the same and cannot be targeted for removal
            // Or this is a problem in preload/index.ts, where a lambda is not considered the same code anyway
            window.api.offAll()
        }

    }, [])

    useEffect(() => {

        if ( ! trace ) {
            return
        }

        setDataflowGraph(new DataflowGraph(trace))
    
    }, [trace])


    if ( ! dataflowGraph ) {
        return (
            <div className="flex items-center justify-center h-full text-red-600">
                No graphs loaded
            </div>
        )
    }

    return (
        <div className="w-full h-5/6 flex flex-col flex-grow overflow-auto pr-2 pl-2 pt-2">
            <DataflowGraphPanel
                className="h-full"
                dataflowGraph={dataflowGraph}
            />
        </div>
        
    );
}

export default DataflowGraphView;