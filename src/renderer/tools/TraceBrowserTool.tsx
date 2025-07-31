
import { useState, useEffect, FC, useRef } from "react";

import TopologyView from "@renderer/views/TopologyView";
import DataflowGraphView from "@renderer/views/DataflowView";
import Header from "@renderer/components/Misc/Header";
import Title from "@renderer/components/Misc/Title";
import { ExecutionTrace } from "@common/types";
import { ExecutionTraceProvider } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";


const TraceBrowserTool: FC = () => {

    const topologyViewRef = useRef<HTMLDivElement>(null);
    const dataflowViewRef = useRef<HTMLDivElement>(null);
    const [currentView, setCurrentView] = useState<"Topology" | "Dataflow">("Topology");
    const [trace, setTrace] = useState<ExecutionTrace | null>(null);

    //TODO: implement a customizable speed scrolling mechanism
    const scrollToView = (view: "Topology" | "Dataflow") => {
        if (view === "Topology" && topologyViewRef.current) {
            topologyViewRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (view === "Dataflow" && dataflowViewRef.current) {
            dataflowViewRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                setCurrentView("Dataflow");
                scrollToView("Dataflow");
            } else if (event.key === "ArrowLeft") {
                setCurrentView("Topology");
                scrollToView("Topology");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);


    const loadTraceFromJSON = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`);
        const trace = ExecutionTrace.loadTraceFromJSON(filename, content);
        setTrace(trace);
    };

    
    useEffect(() => {

        window.api.onLoadTrace( loadTraceFromJSON ); 

        return () => {
            window.api.offAll(); 
        };

    }, [])


    if (!trace) {
        return (
            <div className="w-screen h-screen flex flex-col">
                <Header />
                <div className="flex items-center justify-center h-full text-red-600">
                    No trace loaded
                </div>
            </div>
        )
    }

    return (
        <div className="w-screen h-screen flex flex-col">
            <Header />
            <Title content={currentView} />
            <ExecutionTraceProvider trace={trace}>
                <div className="w-full h-full flex flex-row overflow-x-hidden">
                    <div className="w-full h-full flex-shrink-0" ref={topologyViewRef}>
                        <TopologyView />
                    </div>
                    <div className="w-full h-full flex-shrink-0" ref={dataflowViewRef}>
                        <DataflowGraphView />
                    </div>
                </div>
            </ExecutionTraceProvider>
        </div>
    )
        
}

export default TraceBrowserTool;
