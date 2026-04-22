# IPCA App

Electron 34 + React 18 + TypeScript desktop app for analyzing IPC execution traces (PhD research).
Visualizes inter-process communication as interactive graphs using Sigma.js + Graphology.

## Commands

```
npm run dev          # Electron + Vite dev mode (hot reload)
npm run test:run     # Vitest unit tests (tests/common/)
npm run build        # tsc typecheck + electron-vite build
```

## Path aliases (electron-vite)

```
@common  →  src/common/
@renderer →  src/renderer/
@main    →  src/main/
```

## Architecture: three Electron processes

```
src/main/       Electron host — BrowserWindow, file dialogs, Ghidra WebSocket bridge
src/preload/    contextBridge — exposes window.api to renderer (IPC contract)
src/renderer/   React UI — three synchronized graph views
src/common/     Business logic shared by main and renderer
```

## Core data model (src/common/types.ts)

- `Entity` — abstract base; subclasses must implement `getUUID()` and `clone()`
- `Process` — UUID is `"name-pid"` (composite)
- `Resource` — stores **basename only** (constructor strips directory path); UUID is just the filename
- `Event` — fields: `timestamp`, `process`, `eventType`, `source_entities`, `target_entities`, `inputValues`, `outputValues`, `description`. Fields `id` (-1), `address` ("deadbeef"), `color` ("black") are placeholder defaults populated later by extensions.
- `EdgeDirectionStrategy` — enum controlling graph edge direction per event: `SOURCES_TO_TARGETS` (default), `PROCESS_TO_OTHERS`, `OTHERS_TO_PROCESS`
- `ResourceType` — enum; value `4` = REGULAR_FILE

## Key utilities (src/common/utils.ts)

- `toUniform(str)` — string → [0,1] hash (used for layout coordinates and colors)
- `getNodesByType(graph)` — returns `{ Process[], File[], FIFO[], STDIO[], Others[] }`. STDIO detection: Resource UUID ends with `"STDOUT"`, `"STDERR"`, or `"STDIN"` (string check, not type check)
- `getPreviousNodeForEntity(graph, node, reversed?)` — walks in/out neighbors to find prior event for same entity
- `getProcessPriorEvents(graph, event)` — all earlier events for the same process, ordered by ID
- `hexToAscii(hexString)` — hex → UTF-8; pads odd-length strings with leading zero
- Graph nodes are expected to have `entity` and `event` attributes pre-set by constructors

## Functional domains

### ExecutionTrace (`src/common/ExecutionTrace/`)

Parses/exports JSON trace files. Extension system runs on import:

- **Static extensions** — always applied: `EventMerger`, `EventSplitter`, `EdgeDirectionOverwrite`
- **Tagged extensions** — opt-in via `_extensions[].tag` in JSON: e.g. `EventColors`
- To add one: implement `ExecutionTraceImporterExtension`, register in `ImporterExtensionsGlobals.ts`

JSON wire format:

```json
{ "processes": [{"name":"...", "pid":0}],
  "resources": [{"path":"...", "resource_type":4}],
  "events": [{"timestamp":0, "process":"p:0", "source_entities":["r:0"],
              "target_entities":[], "input_values":{},
              "output_values":{}, "event_type":"...", "description":"..."}],
  "_extensions": [{"tag":"...", "data":{}}] }
```

Entity refs: `"p:N"` = `processes[N]`, `"r:N"` = `resources[N]`

### TopologyGraph (`src/common/TopologyGraph.ts`)

Graphology `DirectedGraph` of processes and resources.

- `TopologyGraph.create(trace)` — builds initial graph (no edges yet)
- `applyUntilEvent(event)` — clears all edges and replays from start up to that event
- Node attrs: `entity`, `x`, `y`, `size`, `color`, `label`, `highlighted`, `hidden`
- Edge attrs: `event`, `label`, `color`, `size`

### ProvenanceGraph + ProvenanceEngine (`src/common/Provenance/`)

State-expanded graph: each entity gets versioned nodes (`entityUUID-N`), one new version per event it appears as a target.

- `ProvenanceEngine.getProvenanceFromNode(node)` → `[assertedGraph(green), discardedGraph(red), uncertainGraph(orange)]`
- Inter-process tracking via `ResourceContentDeducer` (builds `DataChunk[]` per resource from event replay)
- Storage strategies: `FIFOStorageStrategy` (queue) and `FileStorageStrategy` (cursor + O_APPEND/O_TRUNC)

### Causality Engine (`src/common/Provenance/IntraProcess/`)

User-defined intra-process causal rules:

- `EventPattern(name, predicateCode)` — compiles `(event) => boolean` via `new Function`
- `CausalProperty(name, process, dependencyMode, sourcePattern, targetPattern, predicateCode)` — `dependencyMode`: `"dependent"` (asserted) or `"independent"` (discarded)
- `IntraProcessDeducer.getSourceEvents(event)` → `{ dependent: Event[], independent: Event[] }`
- `causalProperties` live in `ExecutionTraceContext`; `ProvenanceEngine` reads them from there

## React UI (`src/renderer/`)

`TraceBrowserTool` is the root component. It:

- Loads traces via `window.api.onLoadTrace()` (IPC from Electron main)
- Creates `TopologyGraph` and `ProvenanceGraph` **in `useRef` initial values** (once at mount, never updated)
- Renders three side-by-side views per trace: **TopologyView → ProvenanceView → CausalityView**
- Arrow **Left/Right** scrolls between views; Arrow **Up/Down** switches between loaded traces
- Views signal readiness via `onReady()` callback; spinner shown until all three are ready

`ExecutionTraceProvider` (React context) provides to all views:

```
executionTrace, selectedEvent, setSelectedEvent,
hiddenEntities, hiddenEvents,
causalProperties, setCausalProperties
```

## window.api (preload IPC contract)

```ts
onLoadTrace(cb)           // Electron → renderer: file loaded
exportTrace(name, data)   // renderer → Electron: save file
open_ghidra(msg)          // renderer → Electron: launch Ghidra bridge
ghidra_go_to_adress(addr) // renderer → Electron: jump to address in Ghidra
// Events: ghidraConnectedStep1/2, ghidraDisconnectedStep1/2
```

Ghidra bridge: WebSocket singleton at `ws://localhost:8765` (Python script).

## Tests

```
tests/common/   — DataChunk, FIFOStorageStrategy, FileStorageStrategy,
                  CausalProperty, EventPattern
```

Run with `npm run test:run`. No renderer tests exist.

## Agent routing (for sub-agent tasks)

| Task area                                                       | Agent                |
| --------------------------------------------------------------- | -------------------- |
| Electron menu, file I/O, Ghidra bridge                          | `electron-shell`   |
| Trace JSON format, import/export, extensions                    | `execution-trace`  |
| TopologyGraph model + topology Sigma.js view                    | `topology-graph`   |
| ProvenanceGraph, ProvenanceEngine, DataChunk, StorageStrategies | `provenance-graph` |
| EventPattern, CausalProperty, Causality UI                      | `causality-engine` |
