
import { useCallback, useEffect, useState } from "react";


import Workspace from "@renderer/components/Workspace";
import { IPCTraceGraphProvider } from "@renderer/components/IPCTraceGraphContext";
import { IPCTrace } from "@common/types";
import Header from "@renderer/components/Header";
import { IPCTraceGraph } from "@common/IPCTraceGraph";


const Dashboard: React.FC = () => {

    const [ipcTraceGraphs, setIPCTraceGraphs] = useState<IPCTraceGraph[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<number | null>(null)


    const addTrace = (ipcTraceGraph: IPCTraceGraph) => {
        setIPCTraceGraphs(prevIpcTraceGraphs => [...prevIpcTraceGraphs, ipcTraceGraph])
        setCurrentWorkspace(prevCurrentWorkspace => prevCurrentWorkspace === null ? 0 : prevCurrentWorkspace + 1)
    }
        
    const loadTrace = (filename: string, content: string) => {
        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        const ipcTraceGraph = new IPCTraceGraph(ipcTrace)
        addTrace(ipcTraceGraph)
    }

    const exportTrace = useCallback(() => {
        
        if ( ipcTraceGraphs.length === 0 || currentWorkspace === null ) {   
            return
        }

        const ipcTraceGraph = ipcTraceGraphs[currentWorkspace]

        const filenameParts = ipcTraceGraph.getTrace().filename.split('.');
        const filenamePrefix = filenameParts[0]
        const extension = filenameParts[1]
        const defaultFilename = `${filenamePrefix}_export.${extension}`

        const content = ipcTraceGraph.toJSON()
        console.log(content)
        
        window.api.exportTrace(defaultFilename, content)
    }, [currentWorkspace, ipcTraceGraphs])


    useEffect(() => {
        window.api.offLoadTrace( loadTrace )
        window.api.onLoadTrace( loadTrace )
        window.api.offRequestExportTrace( exportTrace )
        window.api.onRequestExportTrace( exportTrace )

    }, [exportTrace])


    let body: JSX.Element

    if ( ipcTraceGraphs.length === 0 || currentWorkspace === null ) {
        body = (
            <div className="flex items-center justify-center h-full text-red-600">
                No graphs loaded
            </div>
        )
    } else {
        body = (
            <div className="w-full h-full flex flex-col">
                <div className="flex flex-row overflow-auto">
                {
                    Array.from(ipcTraceGraphs).map((ipcTraceGraph, index) => {
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentWorkspace(index)}
                                className={`p-2 m-2 border border-black rounded-lg ${currentWorkspace === index ? 'bg-gray-300' : ''}`}
                            >
                                {ipcTraceGraph.getTrace().filename}
                            </button>
                        )
                    })
                }
                </div>
                
                <IPCTraceGraphProvider>
                    <Workspace ipcTraceGraph={ipcTraceGraphs[currentWorkspace]} addTrace={addTrace}/>
                </IPCTraceGraphProvider>
            </div>
        )
    }

    return (
        <div className='w-screen h-screen flex flex-col'>
            <Header/>
            {body}
        </div>
    )
}


export default Dashboard;