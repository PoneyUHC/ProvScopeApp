
import React, { useContext, useState } from 'react';


import ProvenanceGraphPanel from '@renderer/components/ProvenanceGraph/ProvenanceGraphPanel';
import { ExecutionTraceContext, ExecutionTraceContextType } from '@renderer/components/TraceBrowserTool/ExecutionTraceProvider';
import ProvenanceGraph from '@common/ProvenanceGraph';
import { ProvenanceGraphProvider } from '@renderer/components/ProvenanceGraph/ProvenanceGraphProvider';


const provenanceGraphView: React.FC = () => {

    const {
        executionTrace: executionTrace
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const initGraph = (): ProvenanceGraph => {
        return new ProvenanceGraph(executionTrace!)
    }
    const [provenanceGraph, _setprovenanceGraph] = useState<ProvenanceGraph>(initGraph())


    return (
        <div className="w-full h-5/6 flex flex-col flex-grow overflow-auto pr-2 pl-2 pt-2">
            <ProvenanceGraphProvider provenanceGraph={provenanceGraph}>
                <ProvenanceGraphPanel/>
            </ProvenanceGraphProvider>
        </div>
        
    );
}

export default provenanceGraphView;