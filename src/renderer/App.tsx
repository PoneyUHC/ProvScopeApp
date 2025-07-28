
import { useState, useEffect } from "react";

import TopologyView from "@renderer/views/TopologyView";
import DataflowGraphView from "@renderer/views/DataflowView";


const App = () => {

    const [currentView, setCurrentView] = useState<"Dashboard" | "Dataflow">("Dashboard");

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                setCurrentView((prev) => (prev === "Dashboard" ? "Dataflow" : "Dashboard"));
            } else if (event.key === "ArrowLeft") {
                setCurrentView((prev) => (prev === "Dataflow" ? "Dashboard" : "Dataflow"));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return currentView === "Dashboard" ? 
        <TopologyView /> : <DataflowGraphView />
        
}

export default App;
