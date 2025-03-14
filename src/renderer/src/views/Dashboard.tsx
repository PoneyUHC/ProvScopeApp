
import {Component, createRef, useRef, useState} from "react";

import GraphPanel from "@renderer/components/GraphPanel/GraphPanel";
import MiscPanel from "@renderer/components/MiscPanel";
import EventExplorerPanel from "@renderer/components/EventPanel/EventsPanel";
import Header from "@renderer/components/Header";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import ExplorerPanel from "@renderer/components/ExplorerPanel/ExplorerPanel";
import { IPCTraceGraphContext, IPCTraceGraphProvider } from "@renderer/components/IPCTraceGraphContext";


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


const Dashboard: React.FC = () => {

    const [isGraphLoaded, setIsGraphLoaded] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);

    const onDrag = () => {
        setIsDirty(true);
    }


    let body: JSX.Element;

    if ( ! isGraphLoaded ){
        body = ( 
            <div className={`w-full h-full flex items-center justify-center ${borderStyles}`}>
              No graph loaded
            </div>
        )
    } else {
        body = (
            <Allotment className={`${borderStyles}`} onChange={onDrag}>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <ExplorerPanel
                        className={`h-full ${borderStyles}`}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"70%"}>
                    <GraphPanel
                        className={`h-full ${borderStyles}`}
                        isDirty={isDirty}
                        setIsDirty={setIsDirty}
                    />
                </Allotment.Pane>
                <Allotment.Pane minSize={200} preferredSize={"15%"}>
                    <EventExplorerPanel
                        className={`h-full ${borderStyles}`}
                        eventsStyle="w-full h-auto border border-black"
                    />
                </Allotment.Pane>
            </Allotment>
        )
    }

    return (
        <div className="w-screen h-screen flex flex-col">
            <Header/>
            <IPCTraceGraphProvider>
                <div className="w-full h-full flex flex-col overflow-auto">
                    <div className="w-full h-5/6 flex flex-row p-5">
                        {body}
                    </div>
                    <div className="w-full h-1/6 flex flex-row justify-evenly p-5">
                        <MiscPanel 
                            className={`w-full h-full ${borderStyles}`}
                            setIsGraphLoaded={setIsGraphLoaded}
                        />
                    </div>
                </div>

            </IPCTraceGraphProvider>
        </div>
    );
}


export default Dashboard;