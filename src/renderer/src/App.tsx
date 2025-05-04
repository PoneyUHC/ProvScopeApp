
import { IPCTraceGraphProvider } from "./components/IPCTraceGraphContext";
import Dashboard from "./views/Dashboard";
import Dataflow from "./views/Dataflow";
import { useState, useEffect } from "react";

function App() {
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
        <Dashboard /> : 
        <IPCTraceGraphProvider>
            <Dataflow />
        </IPCTraceGraphProvider>
}

export default App;
