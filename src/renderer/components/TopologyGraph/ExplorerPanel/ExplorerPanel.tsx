
import { useCallback, useContext, useState } from 'react';

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
        executionTrace,
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
        hiddenEvents: [hiddenEvents, hideEvent, showEvent],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    if (!executionTrace) { 
        return <Error message={"Execution trace is not available."} />;
    }

    const {
        topologyGraph: topologyGraph,
        selectedNodes: [selectedNodes, setSelectedNodes],
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return <Error message={"Topology graph is not available."} />;
    }

    const [hiddenEventTypes, setHiddenEventTypes] = useState<string[]>([])


    const handleClick = (node: string) => {
        setSelectedNodes([node]);
    }

    const handleShowEntity = (node: string) => {
        const entity = topologyGraph.graph.getNodeAttribute(node, 'entity');
        showEntity(entity);
    }

    const handleHideEntity = (node: string) => {
        const entity = topologyGraph.graph.getNodeAttribute(node, 'entity');
        hideEntity(entity);
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
                                        onShow={() => handleShowEntity(node)}
                                        onHide={() => handleHideEntity(node)}
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


    const handleShowEventType = (eventType: string) => {
        for(const event of executionTrace.events) {
            if(event.eventType === eventType) {
                showEvent(event)
            }
        }
        setHiddenEventTypes((prev) => prev.filter((obj) => obj !== eventType))
    }

    const handleHideEventType = (eventType: string) => {
        for(const event of executionTrace.events) {
            if(event.eventType === eventType) {
                hideEvent(event)
            }
        }
        setHiddenEventTypes((prev) => [...prev, eventType])
    }


    const getEventTypesButtons = useCallback(() => {

        const eventTypes = executionTrace.getEventTypes()
        const title = "Event types"

        return (
            <div className='mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col' key={title}>
                <h1 className='text-xl font-semibold pl-3 bg-gray-300 flex-grow'>{title}</h1>
                    {
                        Array.from(eventTypes).map((eventType) => {
                            return (
                                <ShowHideButton
                                    key={eventType}
                                    content={eventType}
                                    onShow={() => handleShowEventType(eventType)}
                                    onHide={() => handleHideEventType(eventType)}
                                    selected={false}
                                    visible={!hiddenEventTypes.includes(eventType)}
                                />
                            )})
                    }
                <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
            </div>
        )
    }, [executionTrace, hiddenEventTypes])


    return (
        <div className={`${className} overflow-auto`}>
            {getNodeGroupsButtons()}
            {getEventTypesButtons()}
        </div>
    )
}


export default ExplorerPanel;