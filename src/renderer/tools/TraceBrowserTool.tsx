
import { useState, useEffect, FC, useRef } from "react";

import TopologyView from "@renderer/views/TopologyView";
import DataflowGraphView from "@renderer/views/DataflowView";
import Header from "@renderer/components/Misc/Header";
import Title from "@renderer/components/Misc/Title";


const TraceBrowserTool: FC = () => {

    const topologyViewRef = useRef<HTMLDivElement>(null);
    const dataflowViewRef = useRef<HTMLDivElement>(null);
    const [currentView, setCurrentView] = useState<"Topology" | "Dataflow">("Topology");

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
                console.log("Switching to Dataflow view");
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

    return (
        <div className="w-screen h-screen flex flex-col">
            <Header />
            <Title content={currentView} />
            <div className="w-full h-full flex flex-row overflow-x-hidden">
                <div className="w-full h-full flex-shrink-0" ref={topologyViewRef}>
                    <TopologyView />
                </div>
                <div className="w-full h-full flex-shrink-0" ref={dataflowViewRef}>
                    <DataflowGraphView />
                </div>
            </div>
        </div>
    )
        
}

export default TraceBrowserTool;
