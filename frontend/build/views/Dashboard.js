import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component, createRef } from "react";
import GraphPanel from "../components/GraphPanel";
import MiscPanel from "../components/MiscPanel";
import EventExplorerPanel from "../components/EventExplorerPanel";
import Header from "../components/Header";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import OverviewPanel from "../components/OverviewPanel";
const borderStyles = "shadow-[0px_0px_8px] shadow-slate-400 border-black border border-opacity-30";
class Dashboard extends Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "graphPanelRef", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createRef()
        });
        Object.defineProperty(this, "eventExplorerPanelRef", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createRef()
        });
        Object.defineProperty(this, "overviewPanelRef", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createRef()
        });
    }
    render() {
        const onFileLoad = (filename, content) => {
            this.graphPanelRef.current?.loadInstance(filename, content);
        };
        const onExport = () => {
            this.graphPanelRef.current?.exportInstance();
        };
        const onGraphLoaded = (ipcInstance) => {
            this.eventExplorerPanelRef.current?.onGraphLoaded(ipcInstance);
            this.overviewPanelRef.current?.onGraphLoaded();
        };
        const onDrag = () => {
            this.graphPanelRef.current?.refresh();
        };
        return (_jsxs("div", { className: "w-screen h-screen flex flex-col", children: [_jsx(Header, {}), _jsxs("div", { className: "w-full h-full flex flex-col overflow-auto", children: [_jsx("div", { className: "w-full h-5/6 flex flex-row p-5", children: _jsxs(Allotment, { className: `${borderStyles}`, onChange: onDrag, children: [_jsx(Allotment.Pane, { minSize: 200, preferredSize: "15%", children: _jsx(OverviewPanel, { ref: this.overviewPanelRef, graphPanelRef: this.graphPanelRef, className: `h-full ${borderStyles}` }) }), _jsx(Allotment.Pane, { minSize: 200, preferredSize: "70%", children: _jsx(GraphPanel, { ref: this.graphPanelRef, eventExplorerRef: this.eventExplorerPanelRef, overviewPanelRef: this.overviewPanelRef, onGraphLoaded: onGraphLoaded, className: `h-full ${borderStyles}` }) }), _jsx(Allotment.Pane, { minSize: 200, preferredSize: "15%", children: _jsx(EventExplorerPanel, { ref: this.eventExplorerPanelRef, className: `h-full ${borderStyles}`, eventsStyle: "w-full h-auto border border-black", graphPanelRef: this.graphPanelRef }) })] }) }), _jsx("div", { className: "w-full h-1/6 flex flex-row justify-evenly p-5", children: _jsx(MiscPanel, { className: `w-full h-full ${borderStyles}`, onFileLoad: onFileLoad, onExport: onExport }) })] })] }));
    }
}
export default Dashboard;
