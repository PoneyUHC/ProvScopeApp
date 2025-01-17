
import {Component} from "react";

import GraphPanel from "../components/GraphPanel";


class Dashboard extends Component {

    render() {
      return (
        <div className="w-screen h-screen">
            <GraphPanel/>
        </div>
      );
    }
}


export default Dashboard;