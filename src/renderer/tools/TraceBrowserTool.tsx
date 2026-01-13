
import { useState, useEffect, FC, useRef } from "react";

import TopologyView from "@renderer/views/TopologyView";
import ProvenanceGraphView from "@renderer/views/ProvenanceView";
import CausalityView from "@renderer/views/CausalityView";
import Header from "@renderer/components/Misc/Header";
import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import { ExecutionTraceProvider } from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";
import { TopologyGraph } from "@common/TopologyGraph";
import ProvenanceGraph from "@common/Provenance/ProvenanceGraph";


interface TraceBrowserViewProps {
    trace: ExecutionTrace
    isActive: boolean
    currentView: "Topology" | "Provenance" | "Causality"
    setCurrentView
}


const TraceBrowserView: FC<TraceBrowserViewProps> = ({trace, isActive, currentView, setCurrentView}) => {
    
    const topologyViewRef = useRef<HTMLDivElement>(null);
    const topologyGraphRef = useRef<TopologyGraph | null>(
        TopologyGraph.create(trace)
    );
    const provenanceViewRef = useRef<HTMLDivElement>(null);
    const provenanceGraphRef = useRef<ProvenanceGraph | null>(
        new ProvenanceGraph(trace)
    );
    const causalityViewRef = useRef<HTMLDivElement>(null);
    
    const opts: ScrollIntoViewOptions = { behavior: "smooth"};
    
    //TODO: implement a customizable speed scrolling mechanism
    const scrollToView = (view: "Topology" | "Provenance" | "Causality") => {
        if (view === "Topology" && topologyViewRef.current) {
            topologyViewRef.current.scrollIntoView(opts);
        } else if (view === "Provenance" && provenanceViewRef.current) {
            provenanceViewRef.current.scrollIntoView(opts);
        } else if (view === "Causality" && causalityViewRef.current) {
            causalityViewRef.current.scrollIntoView(opts);
        }
    };

    useEffect(() => {
        if (!isActive) return;
        scrollToView(currentView)
    }, [isActive, currentView])

    useEffect(() => {

        if (!isActive) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                setCurrentView(prev => {
                    if (prev === "Topology") {
                        scrollToView("Provenance");
                        return "Provenance";
                    }
                    if (prev === "Provenance") {
                        scrollToView("Causality");
                        return "Causality";
                    }
                    return prev;
                });
            } else if (event.key === "ArrowLeft") {
                setCurrentView(prev => {
                    if (prev === "Causality") {
                        scrollToView("Provenance");
                        return "Provenance";
                    }
                    if (prev === "Provenance") {
                        scrollToView("Topology");
                        return "Topology";
                    }
                    return prev;
                });
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [trace, isActive]);
    
    
    
    return (
        <div className="w-full h-full flex flex-col">
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
                    {/* <div className="w-full h-full flex-shrink-0" ref={causalityViewRef}>
                        <CausalityView />
                    </div> */}
                </div>
            </ExecutionTraceProvider>
        </div>
    )
}


const TraceBrowserTool: FC = () => {
    const [traces, setTraces] = useState<ExecutionTrace[]>([]);
    const [currentTraceIndex, setCurrentTraceIndex] = useState(0);
    
    const traceListRef = useRef<HTMLDivElement>(null);
    const traceBrowserViewRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [currentView, setCurrentView] = useState<"Topology" | "Provenance" | "Causality">("Topology");

    const opts: ScrollIntoViewOptions = { behavior: "smooth"};
    
    const scrollToTrace = (index: number) => {
        const container = traceListRef.current;
        const el = traceBrowserViewRefs.current[index];
        if (!container || !el) return;

        el.scrollIntoView(opts)
    };
    
    const loadTraceFromJSON = (filename: string, content: string) => {
        console.log(`Loading trace ${filename}`);
        const trace = new ExecutionTrace(filename, content);
        setTraces((prev) => [...prev, trace]);
    };
    
    useEffect(() => {
        window.api.onLoadTrace(loadTraceFromJSON);
        return () => {
            window.api.offAll();
        };
    }, []);
    
    // keep refs array length in sync
    useEffect(() => {
        traceBrowserViewRefs.current = traceBrowserViewRefs.current.slice(0, traces.length);
        // if first trace just arrived, ensure we start at it
        if (traces.length === 1) {
            setCurrentTraceIndex(0);
        }
    }, [traces.length]);
    
    // ArrowUp / ArrowDown navigation across traces
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // optional: prevent the browser from scrolling the page
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
            }
            
            if (event.key === "ArrowDown") {
                setCurrentTraceIndex((prev) => {
                    const next = Math.min(prev + 1, traces.length - 1);
                    if (next !== prev) scrollToTrace(next);
                    return next;
                });
            } else if (event.key === "ArrowUp") {
                setCurrentTraceIndex((prev) => {
                    const next = Math.max(prev - 1, 0);
                    if (next !== prev) scrollToTrace(next);
                    return next;
                });
            }
        };
        
        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyDown as any);
    }, [traces.length]);


    if (traces.length === 0) {
        return (
            <div className="w-screen h-screen flex flex-col">
                <Header />
                <div className="flex items-center justify-center h-full text-red-600">
                    No trace loaded
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-screen h-screen flex flex-col overflow-y-hidden">
            <Header />
            <div
                ref={traceListRef}
                className="flex-1 overflow-y-auto"
            >
                <div className="flex flex-col">
                    {
                        traces.map((trace, i) => (
                            <div
                                key={i}
                                className="h-screen flex-shrink-0"
                                ref={(el) => {
                                    traceBrowserViewRefs.current[i] = el;
                                }}
                            >
                                <TraceBrowserView 
                                    trace={trace} 
                                    isActive={i === currentTraceIndex}
                                    currentView={currentView} 
                                    setCurrentView={setCurrentView}
                                    />
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default TraceBrowserTool;
