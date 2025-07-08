import { useState } from 'react';
import DataflowGraph from '@common/DataflowGraph';
import ResizableControlsContainer from './ResizableControlsContainer';

import { Event } from '@common/types';
import { PatternValue, EventPattern } from '@common/causality';


interface PatternPanelProps {
    dataflowGraph: DataflowGraph,
    selectedNodes: string[]
    addPatternGroup: (patternGroup: EventPattern[]) => void
}


const PatternPanel: React.FC<PatternPanelProps> = ({ dataflowGraph, selectedNodes, addPatternGroup }) => {

    const [lockedFields, setLockedFields] = useState<Map<Event, string[]>>(new Map());

    const toggleLock = (event: Event, field: string) => {
        setLockedFields(prev => {
            const current = prev.get(event) || [];
            return new Map(prev).set(event, current.includes(field)
                ? current.filter(f => f !== field)
                : [...current, field]);
        });
    };


    const createPatternGroup = (): void => {

        if (selectedNodes.length === 0) {
            console.warn("No nodes selected to create a pattern group.");
            return;
        }
        const patternGroup: EventPattern[] = [];

        for (const node of selectedNodes) {
            const event = dataflowGraph.graph.getNodeAttribute(node, 'event');
            if (!event) continue;

            const lockedFieldsForEvent = lockedFields.get(event) || [];
            const patternValues = new Map<string, PatternValue>();

            for (const field of Object.keys(event)) {
                if (lockedFieldsForEvent.includes(field)) {
                    patternValues.set(field, new PatternValue(event[field], false));
                } else {
                    patternValues.set(field, new PatternValue('', true));
                }
            }

            const pattern = new EventPattern(patternValues);
            patternGroup.push(pattern);
        }

        console.log("Created pattern group:", patternGroup);
        addPatternGroup(patternGroup);
    };

    const graph = dataflowGraph.graph;
    
    let body: JSX.Element;

    if (selectedNodes.length === 0) {
        body = (
            <div className='self-center w-full h-full flex items-center justify-center overflow-hidden'>
                No nodes selected
            </div>
        );
    } else {
        body = (
            <div>
                {selectedNodes.map(node => {
                    const event = graph.getNodeAttribute(node, 'event');
                    if (!event) {
                        return (
                            <div key={node} className="mb-4 p-2 border rounded bg-white shadow-sm">
                                <p className="font-bold mb-2">{node}</p>
                                <p className="text-red-500">No event data available</p>
                            </div>
                        );
                    }
                    return (
                        <div key={node} className="mb-4 p-2 border rounded bg-white shadow-sm overflow-x-scroll">
                            <p className="font-bold mb-2">{node}</p>
                            {
                                Object.entries(event).map(([field, value]) => {

                                const json = JSON.stringify(value, null, 2)
                                
                                return (
                                    <div key={field}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={lockedFields.get(event)?.includes(field) || false}
                                                onChange={() => toggleLock(event, field)}
                                                className="mr-2"
                                            />
                                            "{field}"
                                        </label>
                                        <span className="whitespace-pre-wrap">: {json}</span>
                                    </div>
                                );
                            })
                            }
                        </div>
                    );
                })}
            </div>
        );
    }


    return (
        <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
            <div className='w-full h-full flex flex-col p-2 bg-gray-100 rounded-lg shadow-md overflow-x-hidden'>

                <div
                    className="w-full flex-grow overflow-y-auto overflow-x-hidden"
                >
                    {body}
                </div>
                <button
                    onClick={createPatternGroup}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Create Pattern Group
                </button>
            </div>
        </ResizableControlsContainer>
    );
}


export default PatternPanel;