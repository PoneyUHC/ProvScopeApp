
import React, { useContext, useState, useRef, useEffect } from 'react';
import Sigma from 'sigma';

import { Allotment } from 'allotment';
import "allotment/dist/style.css";

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import { TopologyGraph } from '@common/TopologyGraph';
import { clamp } from '@common/utils';

import ExplorerPanel from '@renderer/components/TopologyGraph/ExplorerPanel/ExplorerPanel';
import TopologyGraphPanel from '@renderer/components/TopologyGraph/TopologyGraphPanel/TopologyGraphPanel';
import EventPanel from '@renderer/components/TopologyGraph/EventsPanel/EventsPanel';
import { TopologyGraphProvider } from '@renderer/components/TopologyGraph/TopologyGraphProvider';


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


const TopologyView: React.FC = () => {
    
    const {
        executionTrace: executionTrace,
        selectedEvent: [selectedEvent, setSelectedEvent]
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    if( !executionTrace ) return;

    const initGraph = (): TopologyGraph => {
        return TopologyGraph.create(executionTrace!)
    }
    const topologyGraph = useRef<TopologyGraph>(initGraph());
    const [sigma, setSigma] = useState<Sigma | null>(null);


    useEffect(() => {
        if (!sigma) return;
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }, [sigma]);


    useEffect(() => {

        if( !selectedEvent ) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowUp") {
                const currentIndex = executionTrace.events.indexOf(selectedEvent)
                const newIndex = clamp(currentIndex-1, 0, executionTrace.events.length)
                setSelectedEvent(executionTrace.events[newIndex])
            } else if (event.key === "ArrowDown") {
                const currentIndex = executionTrace.events.indexOf(selectedEvent)
                const newIndex = clamp(currentIndex+1, 0, executionTrace.events.length)
                setSelectedEvent(executionTrace.events[newIndex])
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedEvent]);


    const onDragEnd = () => {
        if (!sigma) return;
        sigma.refresh();
    }
    

    return (
        <div className="w-full h-5/6 flex flex-col overflow-auto p-5">
            <TopologyGraphProvider topologyGraph={topologyGraph.current}>
                <Allotment className={`${borderStyles}`} onDragEnd={onDragEnd}>
                    <Allotment.Pane minSize={200} preferredSize={"15%"}>
                        <ExplorerPanel
                            className={`h-full ${borderStyles}`}
                        />
                    </Allotment.Pane>
                    <Allotment.Pane minSize={200} preferredSize={"70%"} className="w-full">
                        <TopologyGraphPanel
                            className={`h-full ${borderStyles}`}
                            setSigma={setSigma}
                        />
                    </Allotment.Pane>
                    <Allotment.Pane minSize={200} preferredSize={"15%"}>
                        <EventPanel
                            className={`h-full ${borderStyles}`}
                            eventsStyle="w-full h-auto border border-black"
                            onRightClick={() => {}}
                        />
                    </Allotment.Pane>
                </Allotment>
            </TopologyGraphProvider>
        </div>
    )
};


export default TopologyView;