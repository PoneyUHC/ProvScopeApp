
import { useEffect, useState } from "react";


import Workspace from "@renderer/components/Workspace";
import { IPCTraceGraphProvider } from "@renderer/components/IPCTraceGraphContext";
import { IPCTrace } from "@common/types";
import Header from "@renderer/components/Header";
import { IPCTraceGraph } from "@common/IPCTraceGraph";


const Dashboard: React.FC = () => {

    const [ipcTraceGraphs, setIPCTraceGraphs] = useState<IPCTraceGraph[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<number | null>(null)

    const loadTrace = (filename: string, content: string) => {
        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        const ipcTraceGraph = new IPCTraceGraph(ipcTrace)
        setIPCTraceGraphs(prevIpcTraceGraphs => [...prevIpcTraceGraphs, ipcTraceGraph])
        setCurrentWorkspace(prevCurrentWorkspace => prevCurrentWorkspace === null ? 0 : prevCurrentWorkspace + 1)
    }

    useEffect(() => {
        window.api.onLoadTrace( loadTrace )
    }, [])


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
                                {ipcTraceGraph.getFilename()}
                            </button>
                        )
                    })
                }
                </div>
                
                <IPCTraceGraphProvider>
                    <Workspace ipcTraceGraph={ipcTraceGraphs[currentWorkspace]}/>
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