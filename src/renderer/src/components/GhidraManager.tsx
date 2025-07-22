
import { useEffect, useState } from "react";

const GhidraManager = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() =>{
        
        window.api.onGhidraIsConnected(() => setConnected(true));
        window.api.onGhidraIsDisconnected(() => setConnected(false));

        if ( window.api.ghidra.isConnected() ) {
            setConnected(true);
        }

        return () => {
            window.api.offGhidraIsConnected(() => setConnected(true));
            window.api.offGhidraIsDisconnected(() => setConnected(false));
        }

    }, []);


    const ghidraStatus = () => {
        return(
            <label>
                Ghidra {connected? "🟢" : "🔴"}
            </label>
        ) 
    }

    return (
        <div className={'top-25 right-7 absolute'}>
            {ghidraStatus()}
        </div>
    )
}

export default GhidraManager;