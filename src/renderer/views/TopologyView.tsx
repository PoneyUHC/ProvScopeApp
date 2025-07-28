
import { useCallback, useEffect, useState } from "react";

import Workspace from "@renderer/components/TopologyGraphPanel/Workspace";
import { TopologyGraphProvider } from "@renderer/components/TopologyGraphPanel/TopologyGraphContext";
import Header from "@renderer/components/Misc/Header";
import TabButton from "@renderer/components/Misc/TabButton";
import Title from "@renderer/components/Misc/Title";
import { ExecutionTrace } from "@common/types";
import { TopologyGraph } from "@common/TopologyGraph";


const tabSelectedButtonStyle = "bg-white border border-b-transparent border-black-200 text-black"
const tabNotSelectedButtonStyle = "bg-gray-200 text-gray-600 border border-b-black-300 hover:bg-black-300"


const TopologyView: React.FC = () => {

    const [topologyGraphs, setTopologyGraphs] = useState<TopologyGraph[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<number | null>(null)


    const addTrace = useCallback((topologyGraph: TopologyGraph) => {
        setTopologyGraphs(prevTopologyGraphs => [...prevTopologyGraphs, topologyGraph])
        setCurrentWorkspace(prevCurrentWorkspace => prevCurrentWorkspace === null ? 0 : topologyGraphs.length)
    }, [topologyGraphs])
        
    const loadTrace = useCallback((filename: string, content: string) => {
        console.log(`Loading trace ${filename}`)
        const json = JSON.parse(content)
        const trace = ExecutionTrace.createInstanceFromJSON(filename, json)
        const topologyGraph = TopologyGraph.create(trace)
        addTrace(topologyGraph)
    }, [addTrace])


    const exportTrace = useCallback(() => {
        
        if ( topologyGraphs.length === 0 || currentWorkspace === null ) {   
            return
        }

        const topologyGraph = topologyGraphs[currentWorkspace]

        const filenameParts = topologyGraph.getTrace().filename.split('.');
        const filenamePrefix = filenameParts[0]
        const extension = filenameParts[1]
        const defaultFilename = `${filenamePrefix}_export.${extension}`

        const content = topologyGraph.toJSON()
        
        window.api.exportTrace(defaultFilename, content)
    }, [currentWorkspace, topologyGraphs])


    const deleteClick = useCallback((index) => { 
        if (topologyGraphs.length === 1) {
            setCurrentWorkspace(null);
            setTopologyGraphs([]);
            return;
        }
        
        setTopologyGraphs((prev) => {
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
    }, [topologyGraphs, currentWorkspace]) 

 
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

    }, [])

        

    let body: JSX.Element

    if ( topologyGraphs.length === 0 || currentWorkspace === null ) {
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
                    Array.from(topologyGraphs).map((topologyGraph, index) => {

                        const text = topologyGraph.traceName;

                        return (
                            <div className="flex items-center">
                                <TabButton
                                    mainClick={() => setCurrentWorkspace(index)}
                                    deleteClick={deleteClick}
                                    index={index}
                                    className="p-2 border-b-2 border-black-200"
                                    text={text}
                                    isSelected={isSelected(index)}
                                    selectedButtonStyle={tabSelectedButtonStyle}
                                    notSelectedButtonStyle={tabNotSelectedButtonStyle}
                                />
                            </div>
                        )
                    })
                }
                </div>
                
                <TopologyGraphProvider>
                    <Workspace topologyGraph={topologyGraphs[currentWorkspace]} addTrace={addTrace}/>
                </TopologyGraphProvider>
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


export default TopologyView;