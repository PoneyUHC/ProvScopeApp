
import { Allotment } from "allotment";
import {Component} from "react";

import "allotment/dist/style.css";

class Test extends Component {

    render() {

        return (
            <div className="w-screen h-screen">
                <Allotment>
                    <Allotment.Pane minSize={200}>
                        <div className="">Hello</div>
                    </Allotment.Pane>
                    <Allotment.Pane minSize={200}>
                        <div className="">Bye</div>
                    </Allotment.Pane>
                </Allotment>
            </div>
            
        )
        
    }
}


export default Test;