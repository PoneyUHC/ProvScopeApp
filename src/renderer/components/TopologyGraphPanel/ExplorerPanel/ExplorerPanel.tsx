
import { useCallback, useContext } from 'react';

import { TopologyGraphContext } from '@renderer/components/TopologyGraphPanel/TopologyGraphContext';
import ShowHideButton from '@renderer/components/TopologyGraphPanel/ExplorerPanel/ShowHideButton';
import Error from '@renderer/components/Misc/Error';


interface ExplorerPanelProps {
    className?: string;
}


const ExplorerPanel: React.FC<ExplorerPanelProps> = ({ className }) => {

    const { 
        topologyGraph: [topologyGraph, _setTopologyGraph], 
        selectedNode: [selectedNode, setSelectedNode],
        hiddenNodes: [hiddenNodes, hideNode, showNode],
    } = useContext(TopologyGraphContext)

    if ( ! topologyGraph || ! selectedNode ){
        return <Error message='No graph loaded'/>
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
                                        onClick={() => setSelectedNode(node)}
                                        onToggle={() => hiddenNodes.has(node) ? showNode(node) : hideNode(node)}
                                        selected={selectedNode == node}
                                        visible={!hiddenNodes.has(node)}
                                    />
                                )
                            })  
                        }
                    <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
                </div>
            )
        })
    }, [topologyGraph, selectedNode, hiddenNodes])

    const buttons = getNodeGroupsButtons()

    return (
        <div className={`${className} overflow-auto`}>
            {buttons}
        </div>
    )
}


export default ExplorerPanel;