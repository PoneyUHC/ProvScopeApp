import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
import EventButton from './EventButton';
var EventExplorerPanelMode;
(function (EventExplorerPanelMode) {
    EventExplorerPanelMode[EventExplorerPanelMode["Explore"] = 0] = "Explore";
    EventExplorerPanelMode[EventExplorerPanelMode["Consequence"] = 1] = "Consequence";
})(EventExplorerPanelMode || (EventExplorerPanelMode = {}));
class EventExplorerPanel extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "onLeftClick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => () => {
                this.setExploreMode(event);
            }
        });
        Object.defineProperty(this, "onRightClick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => (mouseEvent) => {
                this.toggleConsequenceMode(event);
                mouseEvent.preventDefault();
            }
        });
        this.state = {
            events: this.props.events,
            selectedEvent: null,
            mode: EventExplorerPanelMode.Explore
        };
    }
    onGraphLoaded(ipcInstance) {
        this.setState({ events: ipcInstance.events, selectedEvent: ipcInstance.events[0], mode: EventExplorerPanelMode.Explore }, () => {
            this.props.graphPanelRef.current?.applyUntilEvent(ipcInstance.events[0]);
        });
    }
    setExploreMode(event) {
        this.setState({ events: this.state.events, selectedEvent: event, mode: EventExplorerPanelMode.Explore }, () => {
            if (this.state.events) {
                this.props.graphPanelRef.current?.applyUntilEvent(event);
                this.props.graphPanelRef.current?.highlightNode(event.process.getUUID());
            }
        });
    }
    toggleConsequenceMode(event) {
        let newMode = EventExplorerPanelMode.Consequence;
        if (this.state.mode == EventExplorerPanelMode.Consequence && event == this.state.selectedEvent) {
            newMode = EventExplorerPanelMode.Explore;
        }
        this.setState({ selectedEvent: event, mode: newMode });
    }
    getButtonBgColor(event) {
        if (!this.state.events || !this.state.selectedEvent) {
            return "bg-red-600";
        }
        const eventIndex = this.state.events.indexOf(event);
        const selectedEventIndex = this.state.events.indexOf(this.state.selectedEvent);
        if (eventIndex < selectedEventIndex) {
            return "bg-gray-500 hover:bg-gray-400";
        }
        else if (eventIndex > selectedEventIndex) {
            return "bg-gray-400 hover:bg-gray-500";
        }
        else {
            return "bg-red-600";
        }
    }
    render() {
        const events = this.state.events;
        if (!events) {
            return _jsx("div", { className: `flex items-center justify-center font-mono ${this.props.className}`, children: "Load a model to display its events" });
        }
        const graphPanelRef = this.props.graphPanelRef.current;
        let possibleConsequences = [];
        if (this.state.mode == EventExplorerPanelMode.Consequence) {
            possibleConsequences = graphPanelRef.getPossibleConsequences(this.state.selectedEvent);
        }
        const eventButtonList = events.map((event) => {
            let opacity = "opacity-100";
            if (this.state.mode == EventExplorerPanelMode.Consequence && !possibleConsequences.includes(event)) {
                opacity = "opacity-10";
            }
            let bgColor = this.getButtonBgColor(event);
            const content = graphPanelRef.getEventDescription(event);
            const key = this.state.events.indexOf(event);
            return (_jsx("li", { children: _jsx(EventButton, { className: `${opacity} ${bgColor} ${this.props.eventsStyle}`, content: content, onLeftClick: this.onLeftClick(event), onRightClick: this.onRightClick(event) }) }, key));
        });
        if (!eventButtonList) {
            return _jsx("div", { className: 'flex items-center justify-center font-mono text-red-600', children: "An error occured" });
        }
        return (_jsx("ul", { className: `overflow-scroll flex flex-col ${this.props.className}`, children: eventButtonList }));
    }
}
export default EventExplorerPanel;
