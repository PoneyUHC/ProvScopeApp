import React, { useState } from 'react';
import DataflowGraph from '@common/DataflowGraph';
import ResizableControlsContainer from './ResizableControlsContainer';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import { Event } from '@common/types';
import { PatternValue, EventPattern, PatternGroup } from '@common/causality';


interface PatternPanelProps {
    dataflowGraph: DataflowGraph,
    selectedNodes: string[],
    patternGroups: Set<PatternGroup>,
    addPatternGroup: (patternGroup: PatternGroup) => void
    removePatternGroup: (patternGroup: PatternGroup) => void
}


const PatternPanel: React.FC<PatternPanelProps> = ({ dataflowGraph, selectedNodes, patternGroups, addPatternGroup, removePatternGroup }) => {

    const [lockedFields, setLockedFields] = useState<Map<Event, string[]>>(new Map());
    const [description, setDescription] = useState<string>('');

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

        addPatternGroup(new PatternGroup(patternGroup, description));
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



    let createButton: JSX.Element;
    if (description.trim() === '') {
        createButton = (
            <button
                disabled={true}
                title="Description cannot be empty"
                className="w-full bg-blue-300 text-white py-2 mt-1 rounded cursor-not-allowed opacity-60"
            >
                Create Pattern Group
            </button>
        );

    } else if (selectedNodes.length === 0) {
        createButton = (
            <button
                disabled={true}
                title="No nodes selected"
                className="w-full bg-blue-300 text-white py-2 mt-1 rounded cursor-not-allowed opacity-60"
            >
                Create Pattern Group
            </button>
        );
    } else {
        createButton = (
            <button
                onClick={createPatternGroup}
                className="w-full bg-blue-500 text-white py-2 mt-1 rounded hover:bg-blue-600 transition-colors"
            >
                Create Pattern Group
            </button>
        );
    }


    const getVisual = (patternGroup: PatternGroup): React.ReactNode => {
        return (
            <>
                <div key={JSON.stringify(patternGroup)} className="mb-4 p-2 border rounded bg-white shadow-sm">
                    <p className="font-bold mb-2">{patternGroup.name}</p>
                    {Array.from(patternGroup.patterns).map((pattern, index) => (
                        <div key={index} className="mb-2">
                            {Array.from(pattern.pattern.entries()).filter(([_field, value]) => (
                                !value.isWildcard
                            )).map(([field, value]) => (
                                <div key={field}>
                                    <span className="font-semibold">{field}:</span> {JSON.stringify(value.value)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => removePatternGroup(patternGroup)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                    Remove Pattern Group
                </button>
            </>
        );
    };


    return (
        <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
            <div className='w-full h-full flex flex-col p-2 bg-gray-100 rounded-lg shadow-md overflow-x-hidden'>
                <Tabs>
                    <TabList>
                        <Tab>New pattern</Tab>
                        <Tab>Patterns</Tab>
                    </TabList>
                    <TabPanel>
                        <div
                            className="w-full flex-grow overflow-y-auto overflow-x-hidden"
                        >
                            {body}
                        </div>
                        <input
                            type="text"
                            placeholder="Description ..."
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {createButton}
                    </TabPanel>
                    <TabPanel>
                        <div className='overflow-y-auto'>
                            {Array.from(patternGroups).map((patternGroup) => (
                                getVisual(patternGroup)
                            ))}
                        </div>
                    </TabPanel>
                </Tabs>

                
            </div>
        </ResizableControlsContainer>
    );
}


export default PatternPanel;