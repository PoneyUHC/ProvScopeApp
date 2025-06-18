
import { useCallback, useEffect, useState } from "react";


import Workspace from "@renderer/components/Workspace";
import { IPCTraceGraphProvider } from "@renderer/components/IPCTraceGraphContext";
import { IPCTrace } from "@common/types";
import Header from "@renderer/components/Header";
import { IPCTraceGraph } from "@common/IPCTraceGraph";
import Title from "@renderer/components/Title";
import TabButton from "@renderer/components/TabButton";

const tabSelectedButton = "bg-white border border-b-transparent border-black-200 text-black"
const tabNotSelectedButton = "bg-gray-200 text-gray-600 border border-b-black-300 hover:bg-black-300"

const Dashboard: React.FC = () => {

    const [ipcTraceGraphs, setIPCTraceGraphs] = useState<IPCTraceGraph[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<number | null>(null)


    const addTrace = useCallback((ipcTraceGraph: IPCTraceGraph) => {
        setIPCTraceGraphs(prevIpcTraceGraphs => [...prevIpcTraceGraphs, ipcTraceGraph])
        setCurrentWorkspace(prevCurrentWorkspace => prevCurrentWorkspace === null ? 0 : ipcTraceGraphs.length)
    }, [ipcTraceGraphs])
        
    const loadTrace = useCallback((filename: string, content: string) => {
        console.log(`Loading trace ${filename}`)
        const json = JSON.parse(content)
        const ipcTrace = IPCTrace.createInstanceFromJSON(filename, json)
        const ipcTraceGraph = IPCTraceGraph.create(ipcTrace)
        addTrace(ipcTraceGraph)
    }, [addTrace])


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
        
        window.api.exportTrace(defaultFilename, content)
    }, [currentWorkspace, ipcTraceGraphs])


    const deleteClick = useCallback((index) => { 
        if (ipcTraceGraphs.length === 1) {
            setCurrentWorkspace(null);
            setIPCTraceGraphs([]);
            return;
        }
        
        setIPCTraceGraphs((prev) => {
            const newGraphs = prev.filter((_, i) => i !== index);
            // We adjust the current workspace index if necessary
            if (currentWorkspace !== null) {
                if (index === currentWorkspace) {
                    setCurrentWorkspace(newGraphs.length > 0 ? 0 : null);
                } else if (index < currentWorkspace) {
                    setCurrentWorkspace(currentWorkspace - 1);
                }
            }
            return newGraphs;
        });
    }, [ipcTraceGraphs, currentWorkspace]) 

 
    const isSelected = useCallback((index) => {
        return currentWorkspace === index
    }, [currentWorkspace])

    
    useEffect(() => {
        window.api.onLoadTrace( loadTrace )
        window.api.onRequestExportTrace( exportTrace )

        return () => {
            // FIXME: callback being updated each time, a simple off for specific events does no work
            // as the callback is not the same and cannot be targeted for removal
            // Or this is a problem in preload/index.ts, where a lambda is not considered the same code anyway
            window.api.offAll()
        }

    }, [loadTrace, exportTrace])

        

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

                        const text = ipcTraceGraph.traceName;

                        return (
                            <div className="flex items-center">
                                <TabButton
                                    mainClick={() => setCurrentWorkspace(index)}
                                    deleteClick={deleteClick}
                                    index={index}
                                    className="p-2 border-b-2 border-black-200"
                                    text={text}
                                    isSelected={isSelected(index)}
                                    selectedButtonStyle={tabSelectedButton}
                                    notSelectedButtonStyle={tabNotSelectedButton}
                                />
                            </div>
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
            <Title content="Dashboard"/>  
            {body}
        </div>
    )
}


export default Dashboard;