
import { Event, Resource, ResourceType } from "@common/types";
import ResourceContent from "./ResourceContent";
import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
import StorageStrategy from "./StorageStrategy/StorageStrategy";
import FIFOStorageStrategy from "./StorageStrategy/FIFOStorageStrategy";
import FileStorageStrategy from "./StorageStrategy/FileStorageStrategy";
import ProvenanceGraph from "../ProvenanceGraph";


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


    fillResourceContent(pGraph: ProvenanceGraph): void {

        const graph = pGraph.graph

        for ( const event of this.trace.events ) {
            for ( const [resource, resourceContent] of this.resourceContentMap ) {

                const node = graph.findNode((n) => graph.getNodeAttribute(n, 'event') === event && graph.getNodeAttribute(n, 'entity') === resource);
                if ( !node ){
                    console.error("ResourceContentDeducer.fillResourceContent: Event node not found in provenance graph", event);
                }                    

                if ( this.ignoredResources.has(resource) ) {
                    graph.setNodeAttribute(node, 'resourceContent', null);
                    continue;
                }

                resourceContent.applyEvent(event);
                graph.setNodeAttribute(node, 'resourceContent', resourceContent.clone());
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