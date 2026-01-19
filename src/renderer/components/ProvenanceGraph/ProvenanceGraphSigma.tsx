
import React from "react";

import type { Sigma } from "sigma";
import '@react-sigma/core/lib/style.css';

import {
	SigmaContainer,
	ControlsContainer,
	FullScreenControl,
	ZoomControl,
} from '@react-sigma/core'
import { DirectedGraph } from "graphology";
import { NodeSquareProgram } from "@sigma/node-square";
import { NodeCircleProgram } from "sigma/rendering";


import ProvenanceGraphEvents from "@renderer/components/ProvenanceGraph/ProvenanceGraphEvents";
import EventInfosPanel from "@renderer/components/ProvenanceGraph/EventInfosPanel";
import NodeInfosPanel from "./NodeInfosPanel";


export type ProvenanceGraphSigmaProps = {
	graph: DirectedGraph;
	setSigma: (sigma: Sigma | null) => void;
};


const ProvenanceGraphSigma: React.FC<ProvenanceGraphSigmaProps> = ({graph, setSigma}) => {

	const settings = {
		renderLabels: false, 
		allowInvalidContainer: true, 
		nodeProgramClasses: { 
			square: NodeSquareProgram, 
			circle: NodeCircleProgram, 
		}
	}
	
	
	return (
		<SigmaContainer ref={setSigma} graph={graph} settings={settings}>
			<ControlsContainer position="bottom-right">
			<ZoomControl />
			<FullScreenControl />
			</ControlsContainer>
			
			<ProvenanceGraphEvents />
			<EventInfosPanel />
            <NodeInfosPanel />
		</SigmaContainer>
	);
};

export default ProvenanceGraphSigma;
