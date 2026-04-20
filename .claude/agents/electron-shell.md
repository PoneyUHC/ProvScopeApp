---
name: electron-shell
description: Electron main process, window lifecycle, Electron menu, file I/O, Ghidra WebSocket bridge, contextBridge IPC API. Use for tasks involving src/main/, src/preload/, or GhidraCommunication.
---

# Domain: Electron Shell

Electron 34 + TypeScript. Owns the process boundary between OS and React renderer.

## Key files
- src/main/index.ts — BrowserWindow, GhidraCommunication singleton init
- src/main/menuBuilder.ts — Electron Menu, file dialogs (readFileSync/writeFileSync), lcs.py spawn
- src/preload/index.ts — contextBridge: exposes window.api to renderer
- src/common/software/ghidra/GhidraCommunication.ts — WebSocket singleton to Python bridge at ws://localhost:8765

## IPC channels
Send:  exportTrace(filename, content), open_ghidra(msg), ghidra_go_to_adress(address)
Recv:  loadTrace(filename, content), requestExportTrace(), ghidraConnectedStep1/2, ghidraDisconnectedStep1/2

## Build
electron-vite; aliases: @main=src/main, @common=src/common, @renderer=src/renderer

## Do not touch
src/renderer/, src/common/Provenance/, src/common/ExecutionTrace/, src/common/TopologyGraph.ts
