

import Header from '@renderer/components/Header';
import React, { useContext, useEffect, useState } from 'react';
import { IPCTraceGraphContext } from "@renderer/components/IPCTraceGraphContext";
import { IPCTraceGraph } from '@common/IPCTraceGraph';
import { IPCTrace } from '@common/types';
import GraphPanel from '@renderer/components/GraphPanel/GraphPanel';
import Title from '@renderer/components/Title';
import DataflowGraph from '@common/DataflowGraph';
import { DirectedGraph } from 'graphology';


const Dataflow: React.FC = () => {

    const [isGraphLoaded, setIsGraphLoaded] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const dataflowGraphRef = React.useRef<DataflowGraph | null>(null)

    const { 
        ipcTraceGraph: [ipcTraceGraph, _setIpcTraceGraph],
        loadTraceGraph,

    } = useContext(IPCTraceGraphContext)
        
    const loadTrace = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`)
        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        const ipcTraceGraph = IPCTraceGraph.create(ipcTrace)
        loadTraceGraph(ipcTraceGraph)
        setIsGraphLoaded(true)
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
        
        if ( ! ipcTraceGraph ){
            return
        }

        dataflowGraphRef.current = new DataflowGraph(ipcTraceGraph.getTrace())
        setIsDirty(true)
    
    }, [isGraphLoaded])


    if ( ! isGraphLoaded ){
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
            <div className="w-full h-5/6 flex flex-col overflow-auto p-5">
                    <GraphPanel
                        className="h-full"
                        isDirty={isDirty}
                        setIsDirty={setIsDirty}
                        getGraph={() => dataflowGraphRef.current?.graph || new DirectedGraph()}
                    />
            </div>
        </div>
        
    );
};

export default Dataflow;