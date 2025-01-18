
import {Component, createRef, RefObject} from "react";

import GraphPanel from "../components/GraphPanel";
import LoadGraphPanel from "../components/LoadGraphButton";
import EventExplorerPanel from "../components/EventExplorerPanel";


class Dashboard extends Component {

  sendToGraphPanel = (graphPanelRef: RefObject<GraphPanel>, content: string) => {
    graphPanelRef.current?.loadModel(content);
  }

  render() {

    let graphPanelRef = createRef<GraphPanel>();
    let eventExplorerPanelRef = createRef<EventExplorerPanel>();

    const onFileLoad = (content: string) => {
      this.sendToGraphPanel(graphPanelRef, content)
    }

    const onGraphLoaded = (jsonModel: any) => {
      eventExplorerPanelRef.current?.onGraphLoaded(jsonModel)
    }

    return (
      <div className="w-screen h-screen flex flex-col">
        <div className="w-full h-4/5 flex flex-row justify-evenly">
            <GraphPanel 
              ref={graphPanelRef}
              eventExplorerRef={eventExplorerPanelRef}
              onGraphLoaded={onGraphLoaded}
              className="w-4/6 h-11/12 border-2 border-black "
            />
            <EventExplorerPanel 
              ref={eventExplorerPanelRef} 
              className="w-3/12 h-11/12 border-2 border-blue-800"
              eventsStyle="w-full h-auto border-2 border-black"
              graphPanelRef={graphPanelRef}
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