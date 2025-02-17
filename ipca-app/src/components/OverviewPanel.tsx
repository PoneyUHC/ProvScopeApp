
import { Component, RefObject } from 'react';
import GraphPanel from './GraphPanel';

import VisibilityButton from './VisibilityButton';


interface OverviewPanelProps {
    className?: string;
    graphPanelRef: RefObject<GraphPanel>;
}


interface OverviewPanelState {
    graphLoaded: boolean;
}

class OverviewPanel extends Component<OverviewPanelProps, OverviewPanelState> {

    constructor(props: OverviewPanelProps) {
        super(props);
        this.state = {
            graphLoaded: false
        }
    }

    onGraphLoaded() {
        this.setState({graphLoaded: true})
    }


    getNodeGroupsButtons() {

        const nodesByGroup = this.props.graphPanelRef.current?.getNodesByGroup()

        if ( ! nodesByGroup ) {
            return <div className='font-mono'>No nodes</div>;
        }

        const onToggle = (node: string) => {
            this.props.graphPanelRef.current?.toggleNodeVisibility(node)
        }

        return (
            Array.from(nodesByGroup).map((pair) => {
                return (
                    <div className='mb-5 rounded-2xl overflow-hidden border border-black'>
                        <h1 className='text-xl font-semibold pl-2 bg-gray-300'>{pair[0]}</h1>
                        <div>
                            {
                                pair[1].map((node) => {
                                    return <VisibilityButton content={node} onToggle={onToggle} />
                                })  
                            }
                        </div>
                    </div>
                )
            })
        )
    }


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