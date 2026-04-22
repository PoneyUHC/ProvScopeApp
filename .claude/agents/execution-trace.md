---
name: execution-trace
description: JSON execution trace format, import/export pipeline, and the importer extension system (EventMerger, EventSplitter, EdgeDirectionOverwrite, EventColors). Use for tasks involving src/common/ExecutionTrace/ or trace file format changes.
---
# Domain: Execution Trace

Pure TypeScript. Handles loading and saving IPC execution traces.

## Key files

- src/common/ExecutionTrace/ExecutionTrace.ts — ExecutionTrace class (processes/resources/events/extensions)
- src/common/ExecutionTrace/ExecutionTraceImporter.ts — JSON → ExecutionTrace
- src/common/ExecutionTrace/ExecutionTraceExporter.ts — ExecutionTrace → JSON
- src/common/ExecutionTrace/ExecutionTraceImporterExtensions/ — extension system

## Wire format (JSON)

{ processes:[{name,pid}], resources:[{path,resource_type}],
  events:[{timestamp,process:"p:N",source_entities,target_entities,
           input_values,output_values,event_type,description}],
  _extensions:[{tag,data}] }
Entity refs: "p:N" = processes[N], "r:N" = resources[N]

## Extension system

- Static: always applied (EventMerger, EventSplitter, EdgeDirectionOverwrite)
- Tagged: applied only when trace includes that tag (e.g. EventColors)
- To add one: implement ExecutionTraceImporterExtension, register in ImporterExtensionsGlobals.ts

## Shared types (do not redefine)

src/common/types.ts: Entity, Process, Resource, Event, ResourceType, EdgeDirectionStrategy
src/common/utils.ts: IClonable`<T>`

## Tests

tests/common/ — run: npm run test:run

## Do not touch

src/renderer/, src/main/, src/common/Provenance/, src/common/TopologyGraph.ts
