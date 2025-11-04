
import { type RowComponentProps } from "react-window";

import { Event } from "@common/types";
import { useCallback } from "react";

interface EventButtonProps {
    events: Event[];
    selectedEvent: Event | null;
    onLeftClick: (event: Event) => void;
    className?: string;
}

export default function EventButton({ index, style, events, selectedEvent, onLeftClick, className }: RowComponentProps<EventButtonProps>) {

    const getButtonBgColor = useCallback((event: Event) => {

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
    }, [selectedEvent]);

    const bgColor = getButtonBgColor(events[index]);

    return (
        <div className="flex flex-row">
            <button 
                onClick={() => onLeftClick(events[index])}
                className={`font-mono ${className} ${bgColor}`}
                style={style}
            > 
                {events[index].description}
            </button>
        </div>
    );
}