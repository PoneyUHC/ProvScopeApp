
import {Component, createRef, RefObject} from "react";

import GraphPanel from "../components/GraphPanel";
import LoadGraphPanel from "../components/LoadGraphButton";
import EventExplorerPanel from "../components/EventExplorerPanel";


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
                <div className="w-full h-4/5 flex flex-row justify-evenly">
                    <GraphPanel 
                        ref={this.graphPanelRef}
                        eventExplorerRef={this.eventExplorerPanelRef}
                        onGraphLoaded={onGraphLoaded}
                        className="w-4/6 h-11/12 border-2 border-black"
                    />
                    <EventExplorerPanel 
                        ref={this.eventExplorerPanelRef} 
                        className="w-3/12 h-11/12 border-2 border-blue-800"
                        eventsStyle="w-full h-auto border-2 border-black"
                        graphPanelRef={this.graphPanelRef}
                    />
                </div>
                <div className="w-full h-1/5 flex flex-row justify-evenly">
                <LoadGraphPanel 
                    className="w-full h-full border-2 border-red-500" 
                    onFileLoad={onFileLoad}
                />
                </div>
            </div>
        );
    }
}


export default Dashboard;