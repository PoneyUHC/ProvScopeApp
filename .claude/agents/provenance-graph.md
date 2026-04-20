---
name: provenance-graph
description: State-expanded provenance graph, ProvenanceEngine causal coloring, inter-process data tracking (DataChunk, ResourceContent, StorageStrategies), and the ProvenanceView Sigma.js UI. Use for tasks involving causal provenance analysis or the provenance visualization.
---

# Domain: Provenance Graph

Causal provenance: state-expanded graph, inter-process data tracking, provenance coloring.

## State-expanded graph (ProvenanceGraph.ts)
Each entity gets versioned nodes: `entityUUID-N`.
For each event: target entities get new nodes; source entities link to them.
Node attrs: entity, event, version, x, y, size, color, type (circle|square).

## Provenance engine (ProvenanceEngine.ts)
getProvenanceFromNode(node) → [assertedGraph(green), discardedGraph(red), uncertainGraph(orange)]
Calls IntraProcessDeducer.getSourceEvents() and ResourceContentDeducer.getSourceEvents()
— both are CONSUMED here, not defined.

## Inter-process sub-system (InterProcess/)
ResourceContentDeducer: builds resourceContentMap (Resource → ResourceContent) by replaying events.
DataChunk: { data: hex string, sourceEvent: Event }. Op: getContent(size), insertAt(chunks, pos).
StorageStrategy (abstract): applyEvent / getContent.
  FIFOStorageStrategy: queue; write appends, read pops from front.
  FileStorageStrategy: cursor per (pid,fd); tracks O_APPEND / O_TRUNC from OpenEvent.

## UI (src/renderer/)
ProvenanceView → ProvenanceGraphProvider (context: {provenanceGraph, selectedNodes})
ProvenanceGraphPanel: Sigma canvas + entity reorder list (DragDropListPanel).
ProvenanceGraphEvents: node drag, Shift-multiselect, G+click (Ghidra jump), right-click → provenance coloring.
EventInfosPanel / NodeInfosPanel: floating overlays.

## Context consumed (from ExecutionTraceProvider)
hiddenEntities, hiddenEvents → node/edge .hidden
causalProperties → passed into ProvenanceEngine

## Tests
tests/common/DataChunk.test.ts, FIFOStorageStrategy.test.ts, FileStorageStrategy.test.ts
Run: npm run test:run

## Do not touch
IntraProcess/ (owned by causality-engine), TopologyGraph, Causality UI, main/preload.
