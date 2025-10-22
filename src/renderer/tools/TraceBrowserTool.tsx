
import { useState, useEffect, FC, useRef } from "react";

import TopologyView from "@renderer/views/TopologyView";
import ProvenanceGraphView from "@renderer/views/ProvenanceView";
import Header from "@renderer/components/Misc/Header";
import Title from "@renderer/components/Misc/Title";
import { ExecutionTrace } from "@common/types";
import { ExecutionTraceProvider } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";
import { TopologyGraph } from "@common/TopologyGraph";
import ProvenanceGraph from "@common/ProvenanceGraph";


const TraceBrowserTool: FC = () => {

    const topologyViewRef = useRef<HTMLDivElement>(null);
    const topologyGraphRef = useRef<TopologyGraph | null>(null);
    const provenanceViewRef = useRef<HTMLDivElement>(null);
    const provenanceGraphRef = useRef<ProvenanceGraph | null>(null);
    
    const [currentView, setCurrentView] = useState<"Topology" | "Provenance">("Topology");
    const [trace, setTrace] = useState<ExecutionTrace | null>(null);
    const [init, setInit] = useState(false);

    //TODO: implement a customizable speed scrolling mechanism
    const scrollToView = (view: "Topology" | "Provenance") => {
        if (view === "Topology" && topologyViewRef.current) {
            topologyViewRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (view === "Provenance" && provenanceViewRef.current) {
            provenanceViewRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (!trace) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (trace === null) return;
            if (event.key === "ArrowRight") {
                setCurrentView("Provenance");
                scrollToView("Provenance");
            } else if (event.key === "ArrowLeft") {
                setCurrentView("Topology");
                scrollToView("Topology");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [trace]);


    useEffect(() => {
        if (!trace) return;

        topologyGraphRef.current = TopologyGraph.create(trace);
        provenanceGraphRef.current = new ProvenanceGraph(trace);
        setInit(true);

    }, [trace]);


    const loadTraceFromJSON = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`);
        const trace = new ExecutionTrace(filename, content);
        setTrace(trace);
    };

    
    useEffect(() => {

        window.api.onLoadTrace( loadTraceFromJSON ); 

        return () => {
            window.api.offAll(); 
        };

    }, [])


    if (!trace || !init) {
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
                        <TopologyView 
                            topologyGraph={topologyGraphRef.current!} 
                            isViewSelected={currentView === "Topology"} 
                        />
                    </div>
                    <div className="w-full h-full flex-shrink-0" ref={provenanceViewRef}>
                        <ProvenanceGraphView 
                            provenanceGraph={provenanceGraphRef.current!} 
                        />
                    </div>
                </div>
            </ExecutionTraceProvider>
        </div>
    )
        
}

export default TraceBrowserTool;
