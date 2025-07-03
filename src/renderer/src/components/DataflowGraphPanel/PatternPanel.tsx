import { useState } from 'react';
import DataflowGraph from '@common/DataflowGraph';
import ResizableControlsContainer from './ResizableControlsContainer';



interface PatternPanelProps {
    dataflowGraph: DataflowGraph,
    selectedNodes: string[]
}


const PatternPanel: React.FC<PatternPanelProps> = ({ dataflowGraph, selectedNodes }) => {

    const [lockedFields, setLockedFields] = useState<{ [nodeId: string]: string[] }>({});

    const toggleLock = (nodeId: string, field: string) => {
        setLockedFields(prev => {
            const current = prev[nodeId] || [];
            return {
                ...prev,
                [nodeId]: current.includes(field)
                    ? current.filter(f => f !== field)
                    : [...current, field]
            };
        });
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
                                                checked={lockedFields[node]?.includes(field) || false}
                                                onChange={() => toggleLock(node, field)}
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
            <div
                className="w-full h-full p-4 bg-gray-100 rounded-lg shadow-md overflow-y-scroll overflow-x-hidden"
            >
                {body}
            </div>
        </ResizableControlsContainer>
    );
}


export default PatternPanel;