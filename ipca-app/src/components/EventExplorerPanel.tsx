
import React, { Component, RefObject } from 'react';
import EventButton from './EventButton';
import GraphPanel from './GraphPanel';
import { renderToPipeableStream } from 'react-dom/server';


interface EventExplorerPanelProps {
    className?: string;
    eventsStyle?: string;
    events?: Array<any>;
    graphPanelRef: RefObject<GraphPanel>
}

interface EventExplorerPanelState {
    selectedEventID: number;
    events?: Array<any>;
}


class EventExplorerPanel extends Component<EventExplorerPanelProps, EventExplorerPanelState> {

    constructor(props: EventExplorerPanelProps) {
        super(props);
        this.state = {
            events: this.props.events,
            selectedEventID: 0
        }
    }

    selectEvent(id: number) {
        this.props.graphPanelRef.current?.setGraphToEvent(id)
        this.setState({events: this.state.events, selectedEventID: id})
    }

    onGraphLoaded(jsonModel: any) {
        this.setState({events: jsonModel.events, selectedEventID: this.state.selectedEventID})
    }

    render() {
        
        const events = this.state.events
        if (! events) {
            return <div className={`flex items-center justify-center ${this.props.className}`}>Load a model to display its events</div>;
        }


        const eventButtonList = events.map((event, i) => {

            const onClick = () => {
                this.selectEvent(i)
            }

            let bg_color 
            if( i < this.state.selectedEventID ){
                bg_color = "bg-gray-600"
            } else if (i > this.state.selectedEventID) {
                bg_color = "bg-gray-300"
            } else {
                bg_color = "bg-red-600"
            }
            return <li key={i}><EventButton className={`${bg_color} ${this.props.eventsStyle}`} event={event} id={i} onClick={onClick}/></li>
        })

        return (
            <ul className={`overflow-scroll flex flex-col ${this.props.className}`}>
                {eventButtonList}
            </ul>
        );
    }
}

export default EventExplorerPanel;