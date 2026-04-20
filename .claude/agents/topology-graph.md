---
name: topology-graph
description: TopologyGraph Graphology model and all Sigma.js topology visualization components (TopologyView, ExplorerPanel, EventsPanel). Use for tasks involving process/resource graph layout, topology rendering, or event-driven node coloring.
---

# Domain: Topology Graph

React + Sigma.js visualization of process/resource IPC topology over time.

## Model (src/common/TopologyGraph.ts)
TopologyGraph.create(trace) — Graphology DirectedGraph.
- Nodes: one per Process (circle) and Resource (square).
  Attrs: entity, x, y, size, color, label, highlighted, hidden.
- Edges: replayed from trace events via applyUntilEvent(event).
  Attrs: event, label, color, size.
- EdgeDirectionStrategy on each Event controls edge direction.

## UI (src/renderer/)
- TopologyView: Allotment layout — ExplorerPanel | Sigma canvas | EventsPanel
- TopologyGraphProvider: context { topologyGraph, selectedNodes[] }
- TopologyGraphPanelEvents: Sigma event handlers (drag, select, show/hide)
- ExplorerPanel: toggle node/event type visibility
- EventsPanel: virtualized list (react-window); click → selectedEvent + highlight nodes

## Context consumed (from ExecutionTraceProvider)
selectedEvent → triggers applyUntilEvent
hiddenEntities → hides nodes
hiddenEvents → hides edges

## Types
src/common/types.ts: Entity, Process, Resource, Event, EdgeDirectionStrategy
src/common/utils.ts: getNodesByType, clamp, IClonable

## Do not touch
src/common/Provenance/, src/renderer/components/ProvenanceGraph/,
src/renderer/components/Causality/, src/main/, src/preload/
