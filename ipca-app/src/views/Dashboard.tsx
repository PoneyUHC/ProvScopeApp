
import {Component, createRef, RefObject} from "react";

import GraphPanel from "../components/GraphPanel";
import LoadGraphPanel from "../components/LoadGraphButton";


class Dashboard extends Component {

  sendToGraphPanel = (graphPanelRef: RefObject<GraphPanel>, content: string) => {
    graphPanelRef.current?.loadModel(content);
  }

  render() {

    let graphPanelRef = createRef<GraphPanel>();

    return (
      <div className="w-screen h-screen flex flex-col">
        <div className="w-full h-4/5 flex flex-row justify-evenly">
            <GraphPanel ref={graphPanelRef} className="w-4/6 h-11/12 border-2 border-black "/>
            <div className="w-3/12 h-11/12 border-2 border-black"></div>
        </div>
        <div className="w-full h-1/5 flex flex-row justify-evenly">
          <LoadGraphPanel className="w-full h-full border-2 border-red-500" 
              onFileLoad={(content) => {
                this.sendToGraphPanel(graphPanelRef, content)
              }}/>
        </div>
      </div>
    );
  }
}


export default Dashboard;