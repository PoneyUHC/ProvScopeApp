
import { Event, Resource, ResourceType } from "@common/types";
import ResourceContent from "./ResourceContent";
import { ExecutionTrace } from "@common/ExecutionTrace/ExecutionTrace";
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


    deduce(): void {
        this.init()
        this.applyEvents()
    }


    getDataSources(event: Event, resourceContent: ResourceContent): Event[] {

        // TODO: do not depend on explicit event types
        if (event.eventType !== "ExitReadEvent") {
            return [];
        }

        

        return [];
    }
}