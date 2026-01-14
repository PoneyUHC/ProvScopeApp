
import { Event, Resource, ResourceType } from "@common/types";
import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";

import ProvenanceGraph from "../ProvenanceGraph";

import ResourceContent from "./ResourceContent";
import StorageStrategy from "./StorageStrategy/StorageStrategy";
import FIFOStorageStrategy from "./StorageStrategy/FIFOStorageStrategy";
import FileStorageStrategy from "./StorageStrategy/FileStorageStrategy";


export default class ResourceContentDeducer {

    trace: ExecutionTrace;
    resourceContentMap: Map<Resource, ResourceContent>;
    ignoredResources: Set<Resource> = new Set<Resource>();

    constructor(trace: ExecutionTrace) {
        this.trace = trace;
        this.resourceContentMap = new Map<Resource, ResourceContent>();
        this.ignoredResources = new Set<Resource>();
    }


    init(): void {

        this.resourceContentMap.clear();
        this.ignoredResources.clear();

        for (const resource of this.trace.resources) {
            let strategy: StorageStrategy
            switch (resource.resourceType) {
                case ResourceType.FIFO:
                    strategy = new FIFOStorageStrategy()
                    break;
                case ResourceType.REGULAR_FILE:
                    strategy = new FileStorageStrategy()
                    break;
                default:
                    console.error(`ResourceContentDeducer: No strategy for resource type ${resource.resourceType}`);
                    this.ignoredResources.add(resource);
                    continue;
            }

            const resourceContent = new ResourceContent([], strategy);
            this.resourceContentMap.set(resource, resourceContent);
        }
    }


    deduce(pGraph: ProvenanceGraph): void {
        this.init()
        this.fillResourceContent(pGraph)
    }


    fillResourceContent(provGraph: ProvenanceGraph): void {

        const graph = provGraph.graph

        for ( const event of this.trace.events ) {

            for ( const [resource, resourceContent] of this.resourceContentMap ) {
                
                let contentHostNode : string | undefined;
                // TODO: OpenEvent is a known pitfall, because it does not have the resource as a target
                // but sets the cursor position, which is considered in this implementation as a content change
                // therefore, we should apply OpenEvent anyway

                //handle closevent not having a resource
                // maybe handle each event specifically ?
                if (event.eventType === "OpenEvent") {
                    const resource = event.sourceEntities[0] instanceof Resource ? event.sourceEntities[0] : event.sourceEntities[1]
                    const processNode = graph.findNode((node) => graph.getNodeAttribute(node, 'event') === event && graph.getNodeAttribute(node, 'entity') === event.process)
                    if (! processNode){
                        console.error("Shoud never happen by provenance graph construction")
                        continue;
                    }
                    
                    contentHostNode = graph.findOutNeighbor(processNode, (node) => graph.getNodeAttribute(node, 'entity') === resource)
                } else {
                    contentHostNode = graph.findNode((n) => graph.getNodeAttribute(n, 'event') === event && graph.getNodeAttribute(n, 'entity') === resource);
                }

                console.log(contentHostNode, event)

                if (!contentHostNode) {
                    console.error("Should never happen")
                    continue;
                }
                
                if ( this.ignoredResources.has(resource) ) {
                    graph.setNodeAttribute(contentHostNode, 'resourceContent', null);
                    continue;
                }

                resourceContent.applyEvent(event);
                graph.setNodeAttribute(contentHostNode, 'resourceContent', resourceContent.clone());
            }
        }
    }


    getSourceEvents(resourceContent: ResourceContent, targetEvent: Event): Event[] {

        if ( targetEvent.eventType !== "ExitReadEvent") {
            console.error(`ResourceContentDeducer.getSourceEvents: Unsupported event type ${targetEvent.eventType} for target event.`);
            return [];
        }

        resourceContent.getContent(targetEvent)
        

        return [];
    }
}