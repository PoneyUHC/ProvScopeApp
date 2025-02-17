
import {Component, createRef, RefObject} from "react";

import GraphPanel from "../components/GraphPanel";
import LoadGraphPanel from "../components/LoadGraphButton";
import EventExplorerPanel from "../components/EventExplorerPanel";
import Header from "../components/Header";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import { IPCInstance } from "../types";
import OverviewPanel from "../components/OverviewPanel";


const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"


class Dashboard extends Component {

    graphPanelRef = createRef<GraphPanel>();
    eventExplorerPanelRef = createRef<EventExplorerPanel>();
    overviewPanelRef = createRef<OverviewPanel>();

    render() {

        const onFileLoad = (content: string) => {
            this.graphPanelRef.current?.loadInstance(content);
        }

        const onGraphLoaded = (ipcInstance: IPCInstance) => {
            this.eventExplorerPanelRef.current?.onGraphLoaded(ipcInstance)
            this.overviewPanelRef.current?.onGraphLoaded()
        }

        return (
            
            <div className="w-screen h-screen flex flex-col">
                <Header/>
                <div className="w-full h-full flex flex-col overflow-auto">
                    <div className="w-full h-5/6 flex flex-row p-5">
                        <Allotment className={`${borderStyles}`}>
                            <Allotment.Pane minSize={200} preferredSize={"15%"}>
                                <OverviewPanel
                                    ref={this.overviewPanelRef}
                                    graphPanelRef={this.graphPanelRef}
                                    className={`h-full ${borderStyles}`}
                                />
                            </Allotment.Pane>
                            <Allotment.Pane minSize={200} preferredSize={"70%"}>
                                <GraphPanel 
                                    ref={this.graphPanelRef}
                                    eventExplorerRef={this.eventExplorerPanelRef}
                                    onGraphLoaded={onGraphLoaded}
                                    className={`h-full ${borderStyles}`}
                                />
                            </Allotment.Pane>
                            <Allotment.Pane minSize={200} preferredSize={"15%"}>
                                <EventExplorerPanel 
                                    ref={this.eventExplorerPanelRef} 
                                    className={`h-full ${borderStyles}`}
                                    eventsStyle="w-full h-auto border border-black"
                                    graphPanelRef={this.graphPanelRef}
                                />
                            </Allotment.Pane>
                        </Allotment>
                    </div>
                    <div className="w-full h-1/6 flex flex-row justify-evenly p-5">
                        <LoadGraphPanel 
                            className={`w-full h-full ${borderStyles}`} 
                            onFileLoad={onFileLoad}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


export default Dashboard;