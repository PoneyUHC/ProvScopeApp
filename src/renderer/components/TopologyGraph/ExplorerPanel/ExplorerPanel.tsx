
import { useCallback, useContext } from 'react';

import { getNodesByType } from '@common/utils';

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import { TopologyGraphContext, TopologyGraphContextType } from '@renderer/components/TopologyGraph/TopologyGraphProvider';
import ShowHideButton from '@renderer/components/TopologyGraph/ExplorerPanel/ShowHideButton';
import Error from '@renderer/components/Misc/Error';


interface ExplorerPanelProps {
    className?: string;
}


const ExplorerPanel: React.FC<ExplorerPanelProps> = ({ className }) => {

    const {
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const {
        topologyGraph: topologyGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return <Error message={"Topology graph is not available."} />;
    }


    const handleClick = (node: string) => {
        setSelectedNodes([node]);
    }

    const handleToggle = (node: string) => {
        const entity = topologyGraph.graph.getNodeAttribute(node, 'entity');
        if (hiddenEntities.includes(entity)) {
            showEntity(entity);
        } else {
            hideEntity(entity);
        }
    }

    const getNodeGroupsButtons = useCallback(() => {

        const nodesByType = getNodesByType(topologyGraph.graph)

        return Array.from(nodesByType).map((pair) => {
            return (
                <div className='mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col' key={pair[0]}>
                    <h1 className='text-xl font-semibold pl-3 bg-gray-300 flex-grow'>{pair[0]}</h1>
                        {
                            pair[1].map((node) => {
                                return (
                                    <ShowHideButton
                                        key={node}
                                        content={node}
                                        onClick={() => handleClick(node)}
                                        onToggle={() => handleToggle(node)}
                                        selected={selectedNodes.includes(node)}
                                        visible={!hiddenEntities.includes(topologyGraph.graph.getNodeAttribute(node, 'entity'))}
                                    />
                                )
                            })  
                        }
                    <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
                </div>
            )
        })
    }, [topologyGraph, selectedNodes, hiddenEntities])


    return (
        <div className={`${className} overflow-auto`}>
            {getNodeGroupsButtons()}
        </div>
    )
}


export default ExplorerPanel;