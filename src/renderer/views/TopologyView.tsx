
import React, { useContext, useState, useRef, useEffect } from 'react';
import Sigma from 'sigma';

import { Allotment } from 'allotment';
import "allotment/dist/style.css";

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceContext';
import { TopologyGraph } from '@common/TopologyGraph';

import ExplorerPanel from '@renderer/components/TopologyGraph/ExplorerPanel/ExplorerPanel';
import TopologyGraphPanel from '@renderer/components/TopologyGraph/TopologyGraphPanel/TopologyGraphPanel';
import EventPanel from '@renderer/components/TopologyGraph/EventsPanel/EventsPanel';


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


const TopologyView: React.FC = () => {
    
    const {
        executionTrace: trace,
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const initGraph = (): TopologyGraph => {
        return TopologyGraph.create(trace!)
    }
    const topologyGraph = useRef<TopologyGraph>(initGraph());
    const [sigma, setSigma] = useState<Sigma | null>(null);

    useEffect(() => {
        if (!sigma) return;
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }, [sigma]);


    const onDragEnd = () => {
        if (!sigma) return;
        sigma.refresh();
    }


    return (
        <div className="w-full h-5/6 flex flex-col overflow-auto p-5">
            <Allotment className={`${borderStyles}`} onDragEnd={onDragEnd}>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <ExplorerPanel
                        className={`h-full ${borderStyles}`}
                        topologyGraph={topologyGraph.current}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"70%"} className="w-full">
                    <TopologyGraphPanel
                        className={`h-full ${borderStyles}`}
                        topologyGraph={topologyGraph.current}
                        setSigma={setSigma}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <EventPanel
                        className={`h-full ${borderStyles}`}
                        eventsStyle="w-full h-auto border border-black"
                        topologyGraph={topologyGraph.current}
                        onRightClick={() => {}}
                    />
                </Allotment.Pane>
            </Allotment>
        </div>
    )
};


export default TopologyView;