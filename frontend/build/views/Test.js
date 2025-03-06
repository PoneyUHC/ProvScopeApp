import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Allotment } from "allotment";
import { Component } from "react";
import "allotment/dist/style.css";
class Test extends Component {
    render() {
        return (_jsx("div", { className: "w-screen h-screen", children: _jsxs(Allotment, { children: [_jsx(Allotment.Pane, { minSize: 200, children: _jsx("div", { className: "", children: "Hello" }) }), _jsx(Allotment.Pane, { minSize: 200, children: _jsx("div", { className: "", children: "Bye" }) })] }) }));
    }
}
export default Test;
