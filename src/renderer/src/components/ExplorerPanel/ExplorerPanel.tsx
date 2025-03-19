
import { IPCTraceGraphContext } from '../IPCTraceGraphContext';
import VisibilityButton from './VisibilityButton';
import { useContext } from 'react';

import Error from '../Error';


interface ExplorerPanelProps {
    className?: string;
}


const ExplorerPanel: React.FC<ExplorerPanelProps> = ({ className }) => {

    const { 
        ipcTraceGraph: ipcTraceGraphState, 
        selectedNode: selectNodeState,
        setNodeVisibility: setVisibility
    
    } = useContext(IPCTraceGraphContext)

    const [ipcTraceGraph, _setIpcTraceGraph] = ipcTraceGraphState
    const [selectedNode, setSelectedNode] = selectNodeState

    if ( ! ipcTraceGraph || ! selectedNode ){
        return <Error message='No graph loaded'/>
    }

    const getNodeGroupsButtons = () => {

        const nodesByGroup = ipcTraceGraph.getNodesByGroup()

        return Array.from(nodesByGroup).map((pair) => {
            return (
                <div className='mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col'>
                    <h1 className='text-xl font-semibold pl-3 bg-gray-300 flex-grow'>{pair[0]}</h1>
                        {
                            pair[1].map((node) => {
                                return (
                                    <VisibilityButton 
                                        content={node}
                                        onClick={() => setSelectedNode(node)}
                                        onSetVisibility={(value) => setVisibility(node, value)}
                                        selected={selectedNode == node}
                                    />
                                )
                            })  
                        }
                    <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
                </div>
            )
        })
    }

    const buttons = getNodeGroupsButtons()

    return (
        <div className={`${className} overflow-auto`}>
            {buttons}
        </div>
    )
}


export default ExplorerPanel;