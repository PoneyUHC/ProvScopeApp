
import React, { Component, RefObject } from 'react';
import EventButton from './EventButton';
import GraphPanel from './GraphPanel';


interface EventExplorerPanelProps {
    className?: string;
    eventsStyle?: string;
    events?: Array<any>;
    graphPanelRef: RefObject<GraphPanel>
}

enum EventExplorerPanelMode {
    Explore,
    Consequence
}

interface EventExplorerPanelState {
    selectedEventID: number;
    events?: Array<any>;
    mode: EventExplorerPanelMode
}



class EventExplorerPanel extends Component<EventExplorerPanelProps, EventExplorerPanelState> {

    constructor(props: EventExplorerPanelProps) {
        super(props);
        this.state = {
            events: this.props.events,
            selectedEventID: 0,
            mode: EventExplorerPanelMode.Explore
        }
    }

    onGraphLoaded(jsonModel: any) {
        this.setState({events: jsonModel.events, selectedEventID: 0, mode: EventExplorerPanelMode.Explore})
    }

    setExploreMode(id: number) {
        this.setState({events: this.state.events, selectedEventID: id, mode: EventExplorerPanelMode.Explore }, () => {
            if( this.state.events ){
                this.props.graphPanelRef.current?.setGraphToEvent(id, this.state.events)
            }
        })
    }

    toggleConsequenceMode(id: number) {
        let newMode = EventExplorerPanelMode.Consequence
        if ( this.state.mode == EventExplorerPanelMode.Consequence && id == this.state.selectedEventID ) {
            newMode = EventExplorerPanelMode.Explore
        }
        this.setState({events: this.state.events, selectedEventID: id, mode: newMode })
    }


    onLeftClick = (i: number) => (event: React.MouseEvent) => {
        this.setExploreMode(i)
    }

    onRightClick = (i: number) => (event: React.MouseEvent) => {
        this.toggleConsequenceMode(i)
        event.preventDefault()
    }

    getButtonBgColor(i: number) {
        if( i < this.state.selectedEventID ){
            return "bg-gray-600"
        } else if (i > this.state.selectedEventID) {
            return "bg-gray-300"
        } else {
            return "bg-red-600"
        }
    }
    

    getExploreButtons() { 
        if ( ! this.state.events ) {
            return []
        }

        return this.state.events.map((event, i) => {

            let bgColor = this.getButtonBgColor(i)
            
            return (
                <li key={i}>
                    <EventButton 
                        className={`${bgColor} ${this.props.eventsStyle}`} 
                        event={event} 
                        id={i} 
                        onLeftClick={this.onLeftClick(i)} 
                        onRightClick={this.onRightClick(i)}
                    />
                </li>
            );
        })
    }


    getConsequenceButtons() {

        let graphPanelRef = this.props.graphPanelRef.current
        if ( ! this.state.events || ! graphPanelRef) {
            return []
        }

        let possibleConsequencesIndex = graphPanelRef.getPossibleConsequences(this.state.selectedEventID, this.state.events)

        return this.state.events.map((event, i) => {

            let opacity = "opacity-100"
            if( !possibleConsequencesIndex.includes(i) ){
                opacity = "opacity-10"
            }

            let bgColor = this.getButtonBgColor(i)
            
            return (
                <li key={i}>
                    <EventButton 
                        className={`${opacity} ${bgColor} ${this.props.eventsStyle}`} 
                        event={event} 
                        id={i} 
                        onLeftClick={this.onLeftClick(i)} 
                        onRightClick={this.onRightClick(i)}
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

        let eventButtonList
        if ( this.state.mode == EventExplorerPanelMode.Explore ) {
            eventButtonList = this.getExploreButtons()
        } else if (this.state.mode == EventExplorerPanelMode.Consequence) {
            eventButtonList = this.getConsequenceButtons()
        }

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