
import {Component, createRef, RefObject} from "react";

import GraphPanel from "../components/GraphPanel";
import LoadGraphPanel from "../components/LoadGraphButton";
import EventExplorerPanel from "../components/EventExplorerPanel";
import Header from "../components/Header";


class Dashboard extends Component {

    graphPanelRef = createRef<GraphPanel>();
    eventExplorerPanelRef = createRef<EventExplorerPanel>();

    sendToGraphPanel = (graphPanelRef: RefObject<GraphPanel>, content: string) => {
        graphPanelRef.current?.loadModel(content);
    }

    render() {

        const onFileLoad = (content: string) => {
            this.sendToGraphPanel(this.graphPanelRef, content)
        }

        const onGraphLoaded = (jsonModel: any) => {
            this.eventExplorerPanelRef.current?.onGraphLoaded(jsonModel)
        }

        return (
            
            <div className="w-screen h-screen flex flex-col">
                <Header/>
                <div className="w-full h-full flex flex-col overflow-auto">
                    <div className="w-full h-5/6 flex flex-row p-5">
                        <GraphPanel 
                            ref={this.graphPanelRef}
                            eventExplorerRef={this.eventExplorerPanelRef}
                            onGraphLoaded={onGraphLoaded}
                            className="w-3/4 h-11/12 shadow-[0px_0px_10px] shadow-slate-400 border-black border border-opacity-30"
                        />
                        <EventExplorerPanel 
                            ref={this.eventExplorerPanelRef} 
                            className="flex-1 h-11/12 ml-5 shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30"
                            eventsStyle="w-full h-auto border border-black"
                            graphPanelRef={this.graphPanelRef}
                        />
                    </div>
                    <div className="w-full h-1/6 flex flex-row justify-evenly p-5">
                        <LoadGraphPanel 
                            className="w-full h-full shadow-[0px_0px_10px] shadow-slate-400 border-black border border-opacity-30" 
                            onFileLoad={onFileLoad}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


export default Dashboard;