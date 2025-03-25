
import { IPCTraceGraphContext } from '../IPCTraceGraphContext';
import ShowHideButton from './ShowHideButton';
import { useCallback, useContext } from 'react';

import Error from '../Error';


interface ExplorerPanelProps {
    className?: string;
}


const ExplorerPanel: React.FC<ExplorerPanelProps> = ({ className }) => {

    const { 
        ipcTraceGraph: [ipcTraceGraph, _setIpcTraceGraph], 
        selectedNode: [selectedNode, setSelectedNode],
        hiddenNodes: [hiddenNodes, hideNode, showNode],
    } = useContext(IPCTraceGraphContext)

    if ( ! ipcTraceGraph || ! selectedNode ){
        return <Error message='No graph loaded'/>
    }

    const getNodeGroupsButtons = useCallback(() => {

        const nodesByGroup = ipcTraceGraph.getNodesByGroup()

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
    }, [ipcTraceGraph, selectedNode, hiddenNodes])

    const buttons = getNodeGroupsButtons()

    return (
        <div className={`${className} overflow-auto`}>
            {buttons}
        </div>
    )
}


export default ExplorerPanel;