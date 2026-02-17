
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
            
            let contentHostNode : string | null = null
            let resource = Array.from(event.otherEntities)[0] as Resource
            if (this.ignoredResources.has(resource)) {
                continue;
            }

            if (!event.targetEntities.has(resource)) {
                contentHostNode = null
            } else {
                contentHostNode = graph.findNode((n) => graph.getNodeAttribute(n, 'event') === event && graph.getNodeAttribute(n, 'entity') === resource)!;
            }

          
            const resourceContent = this.resourceContentMap.get(resource)
            if (! resourceContent) {
                console.error("Should never happen as long as init() was called")
                continue;
            }
            resourceContent.applyEvent(event);

            if (contentHostNode) {
                graph.setNodeAttribute(contentHostNode, 'resourceContent', resourceContent.clone());
            }
        }
    }


    static getSourceEvents(resourceContent: ResourceContent, targetEvent: Event): Event[] {

        if ( targetEvent.eventType !== "ExitReadEvent") {
            console.error(`ResourceContentDeducer.getSourceEvents: Unsupported event type ${targetEvent.eventType} for target event.`);
            return [];
        }

        const sourceChunks = resourceContent.getContent(targetEvent)

        return sourceChunks.map(chunk => chunk.sourceEvent)
    }
}