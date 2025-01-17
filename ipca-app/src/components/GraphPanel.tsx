
import { SigmaContainer } from '@react-sigma/core';

import { MultiDirectedGraph } from 'graphology';
import { Component } from 'react';
import '@react-sigma/core/lib/style.css';
import Loader from './Loader';


interface GraphPanelState {
    graph: MultiDirectedGraph | null;
}

class GraphPanel extends Component<{}, GraphPanelState> {

    constructor(props: any) {
        super(props);
        this.state = {
            graph: null
        }
    }

    componentDidMount(): void {

        const graph = new MultiDirectedGraph();
        graph.addNode('A', { x: 0, y: 0, label: 'Node A', size: 10 });
        graph.addNode('B', { x: 1, y: 1, label: 'Node B', size: 10 });
        graph.addEdgeWithKey('rel1', 'A', 'B', { label: 'REL_1' });

        this.setState({graph});
    }

    render() {

        const { graph } = this.state;

        // Show a loader if the graph data hasn't been loaded yet
        if (!graph) {
            return <Loader />;
        }

        return (
            <SigmaContainer graph={graph}>
            </SigmaContainer>
        );
    }
}

export default GraphPanel;