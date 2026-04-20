
import { useContext, useState, useEffect } from 'react';

import { ExecutionTraceContext, ExecutionTraceContextType } from '../TraceBrowserTool/ExecutionTraceProvider';
import { ProvenanceGraphContext, ProvenanceGraphContextType } from './ProvenanceGraphProvider';
import ResizableControlsContainer from '@renderer/components/ReactSigmaUtils/ResizableControlsContainer';


const StatsPanel: React.FC = () => {

    const {
        executionTrace,
        hiddenEvents: [hiddenEvents, _hideEvent, _showEvent],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const {
        provenanceGraph,
        provenanceResult: [provenanceResult, _setProvenanceResult],
    } = useContext<ProvenanceGraphContextType>(ProvenanceGraphContext);

    const [totalEvents, setTotalEvents] = useState(0);
    const [hiddenCount, setHiddenCount] = useState(0);
    const [displayedEvents, setDisplayedEvents] = useState(0);
    const [graphNodes, setGraphNodes] = useState(0);
    const [graphEdges, setGraphEdges] = useState(0);
    const [buildTime, setBuildTime] = useState<number | null>(null);
    const [unreachableNodes, setUnreachableNodes] = useState<number | null>(null);

    useEffect(() => {
        if (!executionTrace) return;
        const total = executionTrace.events.length;
        const hidden = hiddenEvents.length;
        setTotalEvents(total);
        setHiddenCount(hidden);
        setDisplayedEvents(total - hidden);
    }, [executionTrace, hiddenEvents]);

    useEffect(() => {
        if (!provenanceGraph) return;
        setGraphNodes(provenanceGraph.graph.order);
        setGraphEdges(provenanceGraph.graph.size);
        setBuildTime(provenanceGraph.buildTimeMs);
    }, [provenanceGraph]);

    useEffect(() => {
        if (provenanceResult === null) {
            setUnreachableNodes(null);
            return;
        }
        const reachable = new Set<string>([
            ...provenanceResult.assertedGraph.nodes(),
            ...provenanceResult.discardedGraph.nodes(),
            ...provenanceResult.uncertainGraph.nodes(),
        ]);
        setUnreachableNodes(graphNodes - reachable.size);
    }, [provenanceResult, graphNodes]);

    if (!executionTrace || !provenanceGraph) {
        return null;
    }

    return (
        <ResizableControlsContainer defaultSize={{ width: 220, height: 220 }} position='bottom-left'>
            <div className="w-full h-full bg-gray-100 rounded-lg shadow-md overflow-auto p-2 text-sm">
                <p className="font-semibold border-b border-gray-400 mb-1">Statistics</p>

                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Total events: </span>{totalEvents}
                </p>
                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Hidden events: </span>{hiddenCount}
                </p>
                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Displayed events: </span>{displayedEvents}
                </p>
                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Graph nodes: </span>{graphNodes}
                </p>
                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Graph edges: </span>{graphEdges}
                </p>
                <p className="border-b border-gray-300 py-0.5">
                    <span className="text-slate-500">Build time: </span>{buildTime} ms
                </p>

                {provenanceResult !== null && (
                    <>
                        <p className="font-semibold border-b border-gray-400 mt-1 mb-1">Provenance query</p>
                        <p className="border-b border-gray-300 py-0.5">
                            <span className="text-slate-500">Query time: </span>{provenanceResult.queryTimeMs} ms
                        </p>
                        <p className="border-b border-gray-300 py-0.5">
                            <span className="text-green-600">Asserted nodes: </span>{provenanceResult.assertedGraph.order}
                        </p>
                        <p className="border-b border-gray-300 py-0.5">
                            <span className="text-red-600">Discarded nodes: </span>{provenanceResult.discardedGraph.order}
                        </p>
                        <p className="border-b border-gray-300 py-0.5">
                            <span className="text-orange-500">Uncertain nodes: </span>{provenanceResult.uncertainGraph.order}
                        </p>
                        <p className="py-0.5">
                            <span className="text-slate-500">Unreachable nodes: </span>{unreachableNodes}
                        </p>
                    </>
                )}
            </div>
        </ResizableControlsContainer>
    );
};


export default StatsPanel;
