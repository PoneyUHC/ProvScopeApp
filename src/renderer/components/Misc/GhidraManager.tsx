import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";


const GhidraManager = () => {
    const [connected, setConnected] = useState(false);
    const [webSocketConnected, setWebSocketConnected] = useState(false);

    useEffect(() => {
        window.api.onGhidraIsConnected1(() => setWebSocketConnected(true));
        window.api.onGhidraIsDisconnected1(() => setWebSocketConnected(false));
        window.api.onGhidraIsConnected2(() => setConnected(true));
        window.api.onGhidraIsDisconnected2(() => setConnected(false));

        return () => {
            window.api.offGhidraIsConnected1(() => setWebSocketConnected(true));
            window.api.offGhidraIsDisconnected1(() => setWebSocketConnected(false));
            window.api.offGhidraIsConnected2(() => setConnected(true));
            window.api.offGhidraIsDisconnected2(() => setConnected(false));
        }
    }, []);

    let progressValue = 0;
    let statusText = "disconnected";

    if( !webSocketConnected && !connected ) {
        statusText = "waiting for WebSocket";
        progressValue = 0;
    }

    if( webSocketConnected && !connected ) {
        statusText = "waiting for ghidraBridge";
        progressValue = 50;
    }

    if ( webSocketConnected && connected ) {
        statusText = "connected";
        progressValue = 100;
    }

    return (
        <div>
            <label>
                    Ghidra {connected ? "🟢" : "🔴"}
            </label>
            
            <div className="flex items-center gap-2">
                <CircularProgress variant="determinate" value={progressValue} size={20} />
                <span className="inline-block min-w-[230px] font-mono transition-all duration-200">
                    {statusText}
                </span>
            </div>
        </div>
    )
}

export default GhidraManager;