
import { ControlsContainer } from '@react-sigma/core'

import { Event } from "@common/types";


interface EventInfosPanelProps {
    event: Event | null;
}


const EventInfosPanel: React.FC<EventInfosPanelProps> = ({ event }) => {

    const modifyScrollBehavior = ( ref: HTMLDivElement ) => {

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.scrollLeft += e.deltaY
            }
        }

        ref.addEventListener("wheel", handleWheel, { passive: false })
    }

    if (!event) {
        return (
            <ControlsContainer position="top-left">
                <div className="w-full h-full p-4 bg-gray-100 rounded-lg shadow-md">
                    No event selected
                </div>
            </ControlsContainer>
        );
    }
    
    return (
        <ControlsContainer position="top-left" className="w-1/6 ">
            <div 
                ref={modifyScrollBehavior} 
                className="w-full p-4 bg-gray-100 rounded-lg shadow-md overflow-auto"
            >
                {Object.entries(event).map(([key, value]) => {

                    if (value === null || value === undefined) {
                        return null; // Skip null or undefined values
                    }
                    const json = JSON.stringify(value, null, 2)

                    return (
                        <p key={key} className="border-b-gray-500 border-b p-1">
                            <strong>{key}:</strong> <span className="whitespace-pre-wrap">{json}</span>
                        </p>
                    );
                })}
            </div>
        </ControlsContainer>
    );
};


export default EventInfosPanel;