

import { Event } from "@common/types";
import ResizableControlsContainer from './ResizableControlsContainer';


interface EventInfosPanelProps {
    event: Event | null;
}


const EventInfosPanel: React.FC<EventInfosPanelProps> = ({ event }) => {

    let body: JSX.Element;

    if (!event) {
        body = (
            <div className='self-center h-full flex items-center justify-center overflow-hidden'> 
                No event selected 
            </div>
        )
    } else {
        body = (
            <div>
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
        )
    }
    
    return (
        <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-left'>
            <div
                className="w-full h-full bg-gray-100 rounded-lg shadow-md overflow-auto"
            >
                {body}
            </div>
        </ResizableControlsContainer>
    );
};


export default EventInfosPanel;