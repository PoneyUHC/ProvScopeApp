
import React, { useContext, useEffect, useState } from 'react';
import ExplorerPanel from './ExplorerPanel/ExplorerPanel';
import GraphPanel from './GraphPanel/GraphPanel';
import EventPanel from './EventPanel/EventsPanel';
import { TopologyGraphContext, TopologyGraphContextType } from '@renderer/components/TopologyGraphContext';
import { TopologyGraph } from '@common/TopologyGraph';
import { Event } from '@common/types';

import { Allotment } from 'allotment';
import "allotment/dist/style.css";


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


interface WorkspaceProps {
    topologyGraph: TopologyGraph;
    addTrace: (topologyGraph: TopologyGraph) => void;
}


const Workspace: React.FC<WorkspaceProps> = ({topologyGraph, addTrace}) => {
    
    const [isGraphLoaded, setIsGraphLoaded] = useState<boolean>(false);
    const { loadTraceGraph } = useContext<TopologyGraphContextType>(TopologyGraphContext)
    const [isDirty, setIsDirty] = useState<boolean>(false);

    
    const onDrag = () => {
        setIsDirty(true);
    }


    useEffect(() => {
        loadTraceGraph(topologyGraph)
        setIsGraphLoaded(true)
        setIsDirty(true);
    }, [topologyGraph])

    if ( ! isGraphLoaded ){
        return (
            <div className="flex items-center justify-center h-full text-red-600">
                No graphs loaded
            </div>
        )
    }

    const onRightClick = (event: Event) => {
        const backwardTrace = topologyGraph.backwardTraceFrom(event)
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
                <Allotment.Pane minSize={200} preferredSize={"70%"} className="w-full">
                    <GraphPanel
                        className={`h-full ${borderStyles}`}
                        isDirty={isDirty}
                        setIsDirty={setIsDirty}
                        getGraph={() => topologyGraph.getGraph()}
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