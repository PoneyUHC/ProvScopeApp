
import { Component, RefObject } from 'react';
import GraphPanel from './GraphPanel';

import VisibilityButton from './VisibilityButton';


interface OverviewPanelProps {
    className?: string;
    graphPanelRef: RefObject<GraphPanel>;
}


interface OverviewPanelState {
    graphLoaded: boolean;
    selectedNode: string | null;
}

class OverviewPanel extends Component<OverviewPanelProps, OverviewPanelState> {

    constructor(props: OverviewPanelProps) {
        super(props);
        this.state = {
            graphLoaded: false,
            selectedNode: null
        }
    }

    onGraphLoaded() {
        this.setState({graphLoaded: true})
    }


    selectNode(node: string) {

        if( this.state.selectedNode == node ) {
            return;
        }

        this.setState({selectedNode: node}, () => {
            this.props.graphPanelRef.current?.highlightNode(node)
        })
    }


    getNodeGroupsButtons() {

        const nodesByGroup = this.props.graphPanelRef.current?.getNodesByGroup()

        if ( ! nodesByGroup ) {
            return <div className='font-mono'>No nodes</div>;
        }

        const onToggle = (node: string) => {
            this.props.graphPanelRef.current?.toggleNodeVisibility(node)
        }

        const onSelect = (node: string) => {
            this.selectNode(node)
        }

        return (
            Array.from(nodesByGroup).map((pair) => {
                return (
                    <div className='mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col'>
                        <h1 className='text-xl font-semibold pl-3 bg-gray-300 flex-grow'>{pair[0]}</h1>
                            {
                                pair[1].map((node) => {
                                    return (
                                        <VisibilityButton 
                                            content={node}
                                            onClick={() => onSelect(node)}
                                            onToggle={onToggle}
                                            selected={this.state.selectedNode == node}
                                        />
                                    )
                                })  
                            }
                        <div className='bg-gray-300 flex-grow border-t border-black'>&nbsp;</div>
                    </div>
                )
            })
        )
    }

    //TODO: link the selected node to the graph panel highlight
    render() {

        const {graphLoaded} = this.state;

        if ( ! graphLoaded ) {
            return <div className={`flex items-center justify-center font-mono ${this.props.className}`}>Load a model to display its elements</div>;
        }

        const buttons = this.getNodeGroupsButtons()

        return (
            <div className={`${this.props.className} overflow-auto`}>
                {buttons}
            </div>
        )
    }
}

export default OverviewPanel;