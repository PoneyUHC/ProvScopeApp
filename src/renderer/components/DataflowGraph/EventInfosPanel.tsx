
import { useContext } from 'react';

import Error from '@renderer/components/Misc/Error';
import ResizableControlsContainer from '@renderer/components/ReactSigmaUtils/ResizableControlsContainer';
import { ExecutionTraceContext, ExecutionTraceContextType } from '../TraceBrowserTool/ExecutionTraceProvider';


const EventInfosPanel: React.FC = () => {

    const { 
        selectedEvent: [selectedEvent, _setSelectedEvent],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);
    

    if(!selectedEvent) {
        return (
            <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-left'>
                <Error message="No event selected." />
            </ResizableControlsContainer>
        );    
    }

    
    return (
        <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-left'>
            <div
                className="w-full h-full bg-gray-100 rounded-lg shadow-md overflow-auto"
            >
                {Object.entries(selectedEvent).map(([key, value]) => {
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
        </ResizableControlsContainer>
    );
};


export default EventInfosPanel;