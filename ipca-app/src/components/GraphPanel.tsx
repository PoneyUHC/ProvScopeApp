
import { SigmaContainer } from '@react-sigma/core';


import { Component, RefObject } from 'react';

import '@react-sigma/core/lib/style.css';
import { DirectedGraph } from 'graphology';

import FA2Layout from "graphology-layout-forceatlas2"
import EventExplorerPanel from './EventExplorerPanel';


interface GraphPanelProps {
    className?: string;
    eventExplorerRef?: RefObject<EventExplorerPanel>
    onGraphLoaded?: (jsonModel: string) => void
}

interface GraphPanelState {
    graph: DirectedGraph | null;
    jsonModel: any;
}

class GraphPanel extends Component<GraphPanelProps, GraphPanelState> {

    constructor(props: GraphPanelProps) {
        super(props);
        this.state = {
            graph: null,
            jsonModel: null
        }
    }


    setGraphToEvent(event_id: number) {

    }


    applyEvent(event: JSON) {

    }


    loadModel(content: string) {

        const jsonModel = JSON.parse(content);
        const graph = new DirectedGraph();

        for (const file of jsonModel.files) {
            var file_label = file.path;
            graph.addNode(file_label, { x: Math.random(), y: Math.random(), size: 10, color: "green", label: file_label });
        }
    
        for (const process of jsonModel.processes) {
            var process_label = `${process.pid}-${process.name}`;
            graph.addNode(process_label, { x: Math.random(), y: Math.random(), size: 10, color: "red", label: process_label });
    
            for (const open_info of process.open_infos) {
                const file = jsonModel.files[open_info.file];
                var file_label = file.path;
                graph.addEdge(process_label, file_label, { color: "black", type: 'arrow'});
            }
    
            for (const [i, channel] of jsonModel.channels.entries()) {
                var channel_label = channel.name;
        
                if( !graph.hasNode(channel_label) ){
                    graph.addNode(channel_label, { x: Math.random(), y: Math.random(), size: 10, color: "blue", label: channel_label });
                }
    
                for (const comm_info of process.communication_infos) {
                    if (comm_info.channel === i) {
                        if ( !graph.hasEdge(process_label, channel_label) ){
                            var edge = graph.addEdge(process_label, channel_label, { size: 3, color: "black", type: 'arrow'});
                            graph.setEdgeAttribute(edge, "definitive", true);
                            graph.setEdgeAttribute(edge, "fd", 1);
                            graph.setEdgeAttribute(edge, "is_opened", true);
                        }
                    }
                }
            }
        }

        FA2Layout.assign(graph, {iterations: 50});

        this.setState({graph, jsonModel}, () => {
            this.props.onGraphLoaded?.(this.state.jsonModel)
        });
    }


    render() {

        const { graph } = this.state;

        let body;
        if (graph) {
            body = <SigmaContainer graph={graph}></SigmaContainer>
        } else {
            body = <div>Load a model to display its graph view</div>;
        }

        return (
            <div className={`flex items-center justify-center ${this.props.className}`}>
                {body}
            </div>
        );
    }
}

export default GraphPanel;