
import React, { useContext } from 'react';
import EventButton from './EventButton';

import { Event } from '@common/types';
import { IPCTraceGraphContext } from '@renderer/components/IPCTraceGraphContext';
import Error from '@renderer/components/Error';


interface EventPanelProps {
    className?: string;
    eventsStyle?: string;
}


const EventPanel: React.FC<EventPanelProps> = ({ className, eventsStyle}) => {

    const { 
        ipcTraceGraph: ipcTraceGraphState, 
        selectedEvent: selectedEventState,
        selectedNode: selectedNodeState
    } = useContext(IPCTraceGraphContext)

    const [ipcTraceGraph, _setIpcTraceGraph] = ipcTraceGraphState
    const [selectedEvent, setSelectedEvent] = selectedEventState
    const [_selectedNode, setSelectedNode] = selectedNodeState

    if ( ! ipcTraceGraph || ! selectedEvent ){
        return <Error message='No graph loaded'/>
    }

    const getButtonBgColor = (event: Event) => {

        const events = ipcTraceGraph.getTrace().events

        const eventIndex = events.indexOf(event)
        const selectedEventIndex = events.indexOf(selectedEvent)

        if( eventIndex < selectedEventIndex ){
            return "bg-gray-500 hover:bg-gray-400"
        } else if (eventIndex > selectedEventIndex) {
            return "bg-gray-400 hover:bg-gray-500"
        } else {
            return "bg-red-600"
        }
    }

    const onLeftClick = (event: Event) => (_e: React.MouseEvent) => {
        setSelectedEvent(event)
        setSelectedNode(event.process.getUUID())
    }

    const onRightClick = (_event: Event) => (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("Right click")
    }

    const events = ipcTraceGraph.getTrace().events
    const eventButtonList = events.map((event) => {

        let opacity = "opacity-100"
        let bgColor = getButtonBgColor(event)

        const content = ipcTraceGraph.getEventDescription(event)
        const key = events.indexOf(event)

        return (
            <li key={key}>
                <EventButton 
                    className={`${opacity} ${bgColor} ${eventsStyle}`} 
                    content={content}
                    onLeftClick={onLeftClick(event)} 
                    onRightClick={onRightClick(event)}
                />
            </li>
        );

    });


    return (
        <ul className={`overflow-scroll flex flex-col ${className}`}>
            {eventButtonList}
        </ul>
    )

}


export default EventPanel;