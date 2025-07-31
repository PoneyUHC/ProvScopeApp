
import React, { useContext } from 'react';

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import { Event } from '@common/types';
import Error from '@renderer/components/Misc/Error';

import EventButton from './EventButton';
import { TopologyGraphContext, TopologyGraphContextType } from '../TopologyGraphProvider';


interface EventPanelProps {
    className?: string;
    eventsStyle?: string;
    onRightClick?: (event: Event) => void;
}


const EventPanel: React.FC<EventPanelProps> = ({ className, eventsStyle, onRightClick}) => {

    const { 
        executionTrace: executionTrace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        selectedObjects: [_selectedObjects, setSelectedObjects],
        hiddenObjects: [hiddenObjects, _hideObject, _showObject],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const {
        topologyGraph: topologyGraph,
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return <Error message={"Topology graph is not available."} />;
    }


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

    const events = executionTrace?.events || [];

    const displayedEvents = events.filter((event) => {
        const objectName = event.getObjectName();
        return !hiddenObjects.includes(objectName)
    });

    const eventButtonList = displayedEvents.map((event, _i) => {

        let bgColor = getButtonBgColor(event)
        const content = event.getDescription()
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