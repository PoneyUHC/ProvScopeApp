
import React, { useContext, useEffect, useState } from 'react';
import ExplorerPanel from './ExplorerPanel/ExplorerPanel';
import GraphPanel from './GraphPanel/GraphPanel';
import EventPanel from './EventPanel/EventsPanel';
import { IPCTraceGraphContext, IPCTraceGraphContextType } from './IPCTraceGraphContext';
import { IPCTraceGraph } from '@common/IPCTraceGraph';
import { Event } from '@common/types';

import { Allotment } from 'allotment';
import "allotment/dist/style.css";


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


interface WorkspaceProps {
    ipcTraceGraph: IPCTraceGraph;
    addTrace: (ipcTraceGraph: IPCTraceGraph) => void;
}


const Workspace: React.FC<WorkspaceProps> = ({ipcTraceGraph, addTrace}) => {
    
    const [isGraphLoaded, setIsGraphLoaded] = useState<boolean>(false);
    const { loadTraceGraph } = useContext<IPCTraceGraphContextType>(IPCTraceGraphContext)

    useEffect(() => {
        loadTraceGraph(ipcTraceGraph)
        setIsGraphLoaded(true)
    }, [ipcTraceGraph])


    const [isDirty, setIsDirty] = useState<boolean>(false);

    const onDrag = () => {
        setIsDirty(true);
    }

    if ( ! isGraphLoaded ){
        return (
            <div className="flex items-center justify-center h-full text-red-600">
                No graphs loaded
            </div>
        )
    }

    const onRightClick = (event: Event) => {
        const backwardTrace = ipcTraceGraph.backwardTraceFrom(event)
        addTrace(backwardTrace)
    }   

    return (
        <div className="w-full h-5/6 flex flex-col overflow-auto p-5">
            <Allotment className={`${borderStyles}`} onDragEnd={onDrag}>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <ExplorerPanel
                        className={`h-full ${borderStyles}`}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"70%"}>
                    <GraphPanel
                        className={`h-full ${borderStyles}`}
                        isDirty={isDirty}
                        setIsDirty={setIsDirty}
                        getGraph={() => ipcTraceGraph.getGraph()}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <EventPanel
                        className={`h-full ${borderStyles}`}
                        eventsStyle="w-full h-auto border border-black"
                        onRightClick={onRightClick}
                    />
                </Allotment.Pane>
            </Allotment>
        </div>
    )
};

export default Workspace;