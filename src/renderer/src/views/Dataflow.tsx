
import Header from '@renderer/components/Header';
import React, { useEffect, useState } from 'react';
import { IPCTrace } from '@common/types';
import Title from '@renderer/components/Title';
import DataflowGraph from '@common/DataflowGraph';
import DataflowGraphPanel from '@renderer/components/DataflowGraphPanel/DataflowGraphPanel';


const Dataflow: React.FC = () => {

    const [ipcTrace, setIPCTrace] = useState<IPCTrace | null>(null)
    const [dataflowGraph, setDataflowGraph] = useState<DataflowGraph | null>(null)

        
    const loadTrace = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`)
        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        setIPCTrace(ipcTrace)
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

        if ( ! ipcTrace ) {
            return
        }

        setDataflowGraph(new DataflowGraph(ipcTrace))
    
    }, [ipcTrace])


    if ( ! dataflowGraph ) {
        return (
            <div className='w-screen h-screen flex flex-col'>
                <Header/>
                <Title content="Dataflow"/>
                <div className="flex items-center justify-center h-full text-red-600">
                    No graphs loaded
                </div>
            </div>
        )
    }

    return (
        <div className='w-screen h-screen flex flex-col'>
            <Header/>
            <Title content="Dataflow"/>
            <div className="w-full h-5/6 flex flex-col flex-grow overflow-auto pr-2 pl-2 pt-2">
                <DataflowGraphPanel
                    className="h-full"
                    dataflowGraph={dataflowGraph}
                />
            </div>
        </div>
        
    );
};

export default Dataflow;