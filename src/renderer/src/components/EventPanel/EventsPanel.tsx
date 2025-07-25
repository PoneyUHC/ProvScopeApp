
import React, { useCallback, useContext } from 'react';
import EventButton from './EventButton';

import { Event } from '@common/types';
import { TopologyGraphContext } from '@renderer/components/TopologyGraphContext';
import Error from '@renderer/components/Error';


interface EventPanelProps {
    className?: string;
    eventsStyle?: string;
    onRightClick?: (event: Event) => void;
}


const EventPanel: React.FC<EventPanelProps> = ({ className, eventsStyle, onRightClick}) => {

    const { 
        topologyGraph: [topologyGraph, _setTopologyGraph], 
        selectedEvent: [selectedEvent, setSelectedEvent],
        selectedNode: [_selectedNode, setSelectedNode],
        hiddenEvents: [hiddenEvents, _hideEvent, _showEvent],

    } = useContext(TopologyGraphContext)

    if ( ! topologyGraph || ! selectedEvent ){
        return <Error message='No graph loaded'/>
    }

    const getButtonBgColor = useCallback((event: Event) => {

        const events = topologyGraph.getEvents()

        const eventIndex = events.indexOf(event)
        const selectedEventIndex = events.indexOf(selectedEvent)

        if( eventIndex < selectedEventIndex ){
            return "bg-gray-500 hover:bg-gray-400"
        } else if (eventIndex > selectedEventIndex) {
            return "bg-gray-400 hover:bg-gray-500"
        } else {
            return "bg-red-600"
        }
    }, [topologyGraph, selectedEvent])

    const onLeftClick = (event: Event) => (_e: React.MouseEvent) => {
        setSelectedEvent(event)
        setSelectedNode(event.process.getUUID())
    }

    const events = topologyGraph.getEvents()

    const filterCallback = useCallback((e) => ! hiddenEvents.has(e), [hiddenEvents])

    const eventButtonList = events.filter(filterCallback).map((event, _i) => {

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