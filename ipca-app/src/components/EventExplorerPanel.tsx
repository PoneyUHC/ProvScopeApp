
import React, { Component, RefObject } from 'react';
import EventButton from './EventButton';
import GraphPanel from './GraphPanel';

import { IPCInstance, Event } from '../types';


interface EventExplorerPanelProps {
    className?: string;
    eventsStyle?: string;
    events?: Event[];
    graphPanelRef: RefObject<GraphPanel>
}

enum EventExplorerPanelMode {
    Explore,
    Consequence
}

interface EventExplorerPanelState {
    selectedEvent: Event | null;
    events?: Event[];
    mode: EventExplorerPanelMode
}



class EventExplorerPanel extends Component<EventExplorerPanelProps, EventExplorerPanelState> {

    constructor(props: EventExplorerPanelProps) {
        super(props);
        this.state = {
            events: this.props.events,
            selectedEvent: null,
            mode: EventExplorerPanelMode.Explore
        }
    }


    onGraphLoaded(ipcInstance: IPCInstance) {
        this.setState({events: ipcInstance.events, selectedEvent: ipcInstance.events[0], mode: EventExplorerPanelMode.Explore})
    }


    setExploreMode(event: Event) {
        this.setState({events: this.state.events, selectedEvent: event, mode: EventExplorerPanelMode.Explore }, () => {
            if( this.state.events ){
                this.props.graphPanelRef.current?.applyUntilEvent(event)
            }
        })
    }


    toggleConsequenceMode(event: Event) {
        let newMode = EventExplorerPanelMode.Consequence
        if ( this.state.mode == EventExplorerPanelMode.Consequence && event == this.state.selectedEvent ) {
            newMode = EventExplorerPanelMode.Explore
        }
        this.setState({selectedEvent: event, mode: newMode })
    }


    onLeftClick = (event: Event) => (mouseEvent: React.MouseEvent) => {
        this.setExploreMode(event)
    }


    onRightClick = (event: Event) => (mouseEvent: React.MouseEvent) => {
        this.toggleConsequenceMode(event)
        mouseEvent.preventDefault()
    }


    getButtonBgColor(event: Event) {

        if ( ! this.state.events || ! this.state.selectedEvent ) {
            return "bg-red-600"
        }

        const eventIndex = this.state.events.indexOf(event)
        const selectedEventIndex = this.state.events.indexOf(this.state.selectedEvent!)

        if( eventIndex < selectedEventIndex ){
            return "bg-gray-500 hover:bg-gray-400"
        } else if (eventIndex > selectedEventIndex) {
            return "bg-gray-400 hover:bg-gray-500"
        } else {
            return "bg-red-600"
        }
    }
    

    getExploreButtons() { 
        if ( ! this.state.events ) {
            return []
        }

        const graphPanelRef = this.props.graphPanelRef.current

        if ( ! graphPanelRef ) {
            return []
        }

        return this.state.events.map((event) => {

            let bgColor = this.getButtonBgColor(event)

            const content = graphPanelRef.getEventDescription(event)

            const key = this.state.events!.indexOf(event)
            
            return (
                <li key={key}>
                    <EventButton 
                        className={`${bgColor} ${this.props.eventsStyle}`} 
                        content={content} 
                        id={key} 
                        onLeftClick={this.onLeftClick(event)} 
                        onRightClick={this.onRightClick(event)}
                    />
                </li>
            );
        })
    }


    getConsequenceButtons() {

        const graphPanelRef = this.props.graphPanelRef.current
        if ( ! this.state.events || ! graphPanelRef) {
            return []
        }

        const possibleConsequences = graphPanelRef.getPossibleConsequences(this.state.selectedEvent!)

        return this.state.events.map((event) => {

            let opacity = "opacity-100"
            if( ! possibleConsequences.includes(event) ){
                opacity = "opacity-10"
            }

            let bgColor = this.getButtonBgColor(event)

            const content = graphPanelRef.getEventDescription(event)
            
            const key = this.state.events!.indexOf(event)

            return (
                <li key={key}>
                    <EventButton 
                        className={`${opacity} ${bgColor} ${this.props.eventsStyle}`} 
                        content={content}
                        id={key} 
                        onLeftClick={this.onLeftClick(event)} 
                        onRightClick={this.onRightClick(event)}
                    />
                </li>
            );
        })
    }


    render() {
        
        const events = this.state.events
        if (! events) {
            return <div className={`flex items-center justify-center font-mono ${this.props.className}`}>Load a model to display its events</div>;
        }

        const graphPanelRef = this.props.graphPanelRef.current!

        let possibleConsequences: Array<Event> = []
        if ( this.state.mode == EventExplorerPanelMode.Consequence) {
            possibleConsequences = graphPanelRef.getPossibleConsequences(this.state.selectedEvent!)
        }

        const eventButtonList = events.map((event) => {

            let opacity = "opacity-100"
            if( this.state.mode == EventExplorerPanelMode.Consequence && !possibleConsequences.includes(event) ){
                opacity = "opacity-10"
            }

            let bgColor = this.getButtonBgColor(event)

            const content = graphPanelRef.getEventDescription(event)
            
            const key = this.state.events!.indexOf(event)

            return (
                <li key={key}>
                    <EventButton 
                        className={`${opacity} ${bgColor} ${this.props.eventsStyle}`} 
                        content={content}
                        id={key} 
                        onLeftClick={this.onLeftClick(event)} 
                        onRightClick={this.onRightClick(event)}
                    />
                </li>
            );

        });


        if ( ! eventButtonList ) {
            return <div className='flex items-center justify-center font-mono text-red-600'>An error occured</div>
        }

        return (
            <ul className={`overflow-scroll flex flex-col ${this.props.className}`}>
                {eventButtonList}
            </ul>
        );
    }
}

export default EventExplorerPanel;