---
name: causality-engine
description: User-defined intra-process causal rules: EventPattern and CausalProperty model, IntraProcessDeducer, and the CausalityView editor UI. Use for tasks involving defining or editing causal properties, event patterns, or the causality panel.
---

# Domain: Causality Engine + UI

User-defined intra-process causal rules — EventPattern and CausalProperty editor.

## Core model (src/common/Provenance/IntraProcess/)
EventPattern(name, predicateCode): compiled JS predicate `(event: Event) => boolean`.
CausalProperty(name, process, dependencyMode, sourcePattern, targetPattern, predicateCode):
  - dependencyMode: "dependent" (asserted path) | "independent" (discarded path)
  - predicateCode: `(sourceEvent, targetEvent) => boolean`
IntraProcessDeducer.getSourceEvents(targetEvent): returns { dependent: Event[], independent: Event[] }
  by matching causal properties against prior same-process events.

## Integration contract
CausalProperty instances live in ExecutionTraceContext.causalProperties[].
ProvenanceEngine (provenance-graph domain) consumes them — do not modify ProvenanceEngine from here.
EventPatterns are local state in CausalityView (not persisted in context).

## UI (src/renderer/)
CausalityView: two-column — EventPatternPanel (left) + CausalPropertyPanel (right).
EventPatternPanel: create/delete EventPattern; shows match count per pattern.
CausalPropertyPanel: create/toggle/delete CausalProperty; fields: sourcePattern, targetPattern,
  process, dependencyMode, predicateCode textarea.

## Types
src/common/types.ts: Event, Process

## Tests
tests/common/CausalProperty.test.ts, tests/common/EventPattern.test.ts
Run: npm run test:run

## Do not touch
ProvenanceEngine.ts, ProvenanceGraph.ts, InterProcess/, TopologyGraph, main/preload.
