
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { List, useDynamicRowHeight } from 'react-window';

import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import { Event } from '@common/types';
import Error from '@renderer/components/Misc/Error';

import EventButton from './EventButton';
import { TopologyGraphContext, TopologyGraphContextType } from '../TopologyGraphProvider';


interface EventPanelProps {}


const EventPanel: React.FC<EventPanelProps> = ({}) => {

    const { 
        executionTrace: executionTrace,
        selectedEvent: [selectedEvent, setSelectedEvent],
        hiddenEntities: [hiddenEntities, _hideObject, _showObject],
        hiddenEvents: [hiddenEvents, _hideEvent, _showEvent]
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    if( !executionTrace ) return null;

    const {
        topologyGraph: topologyGraph,
        selectedNodes: [_selectedNodes, setSelectedNodes],
    } = useContext<TopologyGraphContextType>(TopologyGraphContext);

    if (!topologyGraph) {
        return <Error message={"Topology graph is not available."} />;
    }

    const [displayedEvents, setDisplayedEvents] = useState<Event[]>(executionTrace.events);

    useEffect(() => {
        const filteredEvents = executionTrace.events
        .filter((event) => {
            const entities = [event.process, ...event.otherEntities];
            return entities.every(entity => !hiddenEntities.includes(entity));
        })
        .filter((event) => {
            return !hiddenEvents.includes(event)
        })
        setDisplayedEvents(filteredEvents);
    }, [hiddenEntities, hiddenEvents]);

    const onLeftClick = (event: Event) => {
        console.log("Event clicked:", event);
        setSelectedEvent(event)

        const nodes = topologyGraph.graph.filterNodes((node) => {
            const entity = topologyGraph.graph.getNodeAttribute(node, 'entity');
            return [event.process, ...event.otherEntities].includes(entity);
        });
        setSelectedNodes(nodes);
    }

    const rowHeight = useDynamicRowHeight({
        defaultRowHeight: 50
    });

    return (
        <List
            rowComponent={EventButton}
            rowCount={displayedEvents.length}
            rowHeight={rowHeight}
            rowProps={{ events: displayedEvents, selectedEvent, onLeftClick }}
            overscanCount={20}
        />
    );
}


export default EventPanel;