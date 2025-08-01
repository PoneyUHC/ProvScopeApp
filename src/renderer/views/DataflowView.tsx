
import React, { useContext, useState } from 'react';


import DataflowGraphPanel from '@renderer/components/DataflowGraph/DataflowGraphPanel';
import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import DataflowGraph from '@common/DataflowGraph';
import { DataflowGraphProvider } from '@renderer/components/DataflowGraph/DataflowGraphProvider';


const DataflowGraphView: React.FC = () => {

    const {
        executionTrace: executionTrace
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const initGraph = (): DataflowGraph => {
        return new DataflowGraph(executionTrace!)
    }
    const [dataflowGraph, _setDataflowGraph] = useState<DataflowGraph>(initGraph())


    return (
        <div className="w-full h-5/6 flex flex-col flex-grow overflow-auto pr-2 pl-2 pt-2">
            <DataflowGraphProvider dataflowGraph={dataflowGraph}>
                <DataflowGraphPanel
                    className="h-full"
                />
            </DataflowGraphProvider>
        </div>
        
    );
}

export default DataflowGraphView;