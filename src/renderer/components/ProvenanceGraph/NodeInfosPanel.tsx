
import { useContext } from 'react';

import Error from '@renderer/components/Misc/Error';
import ResizableControlsContainer from '@renderer/components/ReactSigmaUtils/ResizableControlsContainer';
import { ProvenanceGraphContext, ProvenanceGraphContextType } from './ProvenanceGraphProvider';
import { Process } from '@common/types';
import ResourceContent from '@common/Provenance/InterProcess/ResourceContent';


const NodeInfosPanel: React.FC = () => {

    const {
        provenanceGraph,
        selectedNodes: [selectedNodes, _setSelectedNodes],
    } = useContext<ProvenanceGraphContextType>(ProvenanceGraphContext);

    if(!provenanceGraph) {
        return null;
    }

    if(selectedNodes.length == 0) {
        return (
            <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
                <Error message="No nodes selected." />
            </ResizableControlsContainer>
        );    
    }

    if(selectedNodes.length > 1) {
        return (
            <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
                <Error message="Select a single node to see its details" />
            </ResizableControlsContainer>
        );    
    }

    if(provenanceGraph.graph.getNodeAttribute(selectedNodes[0], 'entity') instanceof Process) {
        return (
            <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
                <Error message="Can only see content of a resource" />
            </ResizableControlsContainer>
        );    
    }
    

    const resourceContent = provenanceGraph.graph.getNodeAttribute(selectedNodes[0], 'resourceContent') as ResourceContent

    if(resourceContent.content.length === 0) {
        return (
            <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
                <Error message="Resource is empty" />
            </ResizableControlsContainer>
        );    
    }

    return (
        <ResizableControlsContainer defaultSize={{ width: 300, height: 400 }} position='top-right'>
            <div
                className="w-full h-full bg-gray-100 rounded-lg shadow-md overflow-auto"
            >
                {resourceContent.content.map((chunk, i) => {

                    return (
                        <p key={`chunk${i}`} className="border-b-gray-500 border-b p-1">
                            <strong>{i}:</strong> <span className="whitespace-pre-wrap">{chunk.toString()}</span>
                        </p>
                    );
                })}
            </div>
        </ResizableControlsContainer>
    );
};


export default NodeInfosPanel;