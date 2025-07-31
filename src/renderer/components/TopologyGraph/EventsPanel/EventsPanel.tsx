
import React, { useCallback, useContext } from 'react';

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceContext';
import { TopologyGraph } from '@common/TopologyGraph';
import { Event } from '@common/types';

import EventButton from './EventButton';


interface EventPanelProps {
    className?: string;
    topologyGraph: TopologyGraph;
    eventsStyle?: string;
    onRightClick?: (event: Event) => void;
}


const EventPanel: React.FC<EventPanelProps> = ({ className, topologyGraph, eventsStyle, onRightClick}) => {

    const { 
        selectedEvent: [selectedEvent, setSelectedEvent],
        selectedObjects: [_selectedObjects, setSelectedObjects],
        hiddenObjects: [hiddenObjects, _hideObject, _showObject],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);


    const getButtonBgColor = (event: Event) => {

        if ( !selectedEvent ) {
            return "bg-gray-500 hover:bg-gray-400"
        }

        const eventIndex = event.id
        const selectedEventIndex = selectedEvent.id

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
        setSelectedObjects([event.getObjectName()])
    }

    const events = topologyGraph.getEvents()

    const displayedEvents = events.filter((event) => {
        const objectName = event.getObjectName();
        return !hiddenObjects.includes(objectName)
    });

    const eventButtonList = displayedEvents.map((event, _i) => {

        let bgColor = getButtonBgColor(event)
        const content = topologyGraph.getEventDescription(event)
        const originalIndex = event.id

        return (
            <li key={originalIndex} className='flex flex-row'>
                <p>{originalIndex}</p>
                <EventButton 
                    className={`${bgColor} ${eventsStyle}`} 
                    content={content}
                    onLeftClick={onLeftClick(event)} 
                    onRightClick={onRightClick ? () => onRightClick(event) : () => {}}
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