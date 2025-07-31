
import { useCallback, useContext } from 'react';

import { ExecutionTraceContext } from '@renderer/components/TraceBrowserTool/ExecutionTraceContext';
import ShowHideButton from '@renderer/components/TopologyGraph/ExplorerPanel/ShowHideButton';
import { TopologyGraph } from '@common/TopologyGraph';


interface ExplorerPanelProps {
    className?: string;
    topologyGraph: TopologyGraph;
}


const ExplorerPanel: React.FC<ExplorerPanelProps> = ({ className, topologyGraph }) => {

    const {
        selectedObjects: [selectedObjects, setSelectedObjects],
        hiddenObjects: [hiddenObjects, hideObject, showObject],
    } = useContext(ExecutionTraceContext);
    
    const handleClick = (node: string) => {
        const objectName = topologyGraph.getGraph().getNodeAttribute(node, 'objectName');
        setSelectedObjects([objectName]);
    }

    const handleToggle = (node: string) => {
        const objectName = topologyGraph.getGraph().getNodeAttribute(node, 'objectName');
        if (hiddenObjects.includes(objectName)) {
            hideObject(objectName);
        } else {
            showObject(objectName);
        }
    }

    const getNodeGroupsButtons = useCallback(() => {

        const nodesByGroup = topologyGraph.getNodesByGroup()

        return Array.from(nodesByGroup).map((pair) => {
            return (
                <div className='mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col'>
                    <h1 className='text-xl font-semibold pl-3 bg-gray-300 flex-grow'>{pair[0]}</h1>
                        {
                            pair[1].map((node) => {
                                return (
                                    <ShowHideButton 
                                        content={node}
                                        onClick={() => handleClick(node)}
                                        onToggle={() => handleToggle(node)}
                                        selected={selectedObjects.includes(node)}
                                        visible={!hiddenObjects.includes(node)}
                                    />
                                )
                            })  
                        }
                    <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
                </div>
            )
        })
    }, [topologyGraph, selectedObjects, hiddenObjects])

    const buttons = getNodeGroupsButtons()

    return (
        <div className={`${className} overflow-auto`}>
            {buttons}
        </div>
    )
}


export default ExplorerPanel;