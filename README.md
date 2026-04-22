# ProvScope App

Desktop application to explore and analyze execution traces of inter-process systems.
Expects to be used on outputs of ProvScope Observer (link to be added).

## Features

- Load and browse JSON execution traces produced by ProvScope Oberver (or any other source, as long as the JSON format is respected).
- **Topology view**: processes and resources as a directed graph (Sigma.js + Graphology), with edges replayed up to the currently selected event.
- **Provenance view**: state-expanded graph that versions each entity per event, with asserted / discarded / uncertain provenance computed from a selected node.
- **Causality view**: user-defined intra-process causal rules (event patterns + causal properties) that feed the provenance computation.
- Three views are kept synchronized per trace. Left/Right arrows scroll between views; Up/Down arrows switch between loaded traces.
- Ghidra integration to jump from a trace event's address to the corresponding location in a disassembled binary.
- Trace export (save the current trace, including user edits, back to JSON).

## Project Setup

Easy setup is possible through the `init.bash` script. After initialization, you should activate the python venv in your shell.

```bash
./init.bash
source ./venv/bin/activate
```

This script will create a python venv with the proper modules and activate it under the current shell.
It will also download the necessary dependencies for both the Python and the React codebases.

To clear the configuration, use the `clean.bash` script:

```bash
./clean.bash
```

## Running the app

```bash
$ npm run dev
```

## Building the app

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Application architecture

The application was originally a web-based application, using React as the development framework.
The idea was to have a portable application, with a fast development cycle over a well-known framework.
After encountering typical problems for a web app (among which host-system interaction restrictions), I decided to make the app a desktop app.
To minimize the development impact, Electron seemed like a good choice, allowing to migrate directly from a web-app to a desktop app, while keeping the exact same code.

Electron acts as the englobing process, which can have normal-process interactions with the underlying system (typically reading files from the file system).
It wraps the render thread (the react web app), which handles all the rendering of the application and the user interactions.

The codebase is split in four top-level source directories:

- `src/main/` — Electron main process (window lifecycle, application menu, file dialogs, Ghidra bridge launcher).
- `src/preload/` — `contextBridge` definitions exposing a typed `window.api` to the renderer.
- `src/renderer/` — React UI (views, panels, Sigma.js graph components).
- `src/common/` — business logic shared between main and renderer (trace model, graphs, provenance engine, causality engine).

## Ghidra integration

The app can drive a running Ghidra instance to jump to the address associated with a trace event. The integration is implemented as a WebSocket bridge between the Electron renderer and a local Python server.

Components:

- `src/scripts/ghidra/bridge.py` — Python WebSocket server (listens on `ws://localhost:8765`). Receives commands from the app and forwards them to Ghidra.
- `src/scripts/ghidra/proxy.py` — wrapper around `ghidra_bridge` (the `GhidraBridge` Jython bridge) that exposes `connect_to_ghidra`, `go_to_address`, and `has_active_connection`.
- `src/scripts/ghidra/headlessGhidra.bash` — helper script that creates a Ghidra project (if missing) via `analyzeHeadless` and then launches Ghidra on it. Paths to the Ghidra installation, project directory and binary file are set at the top of the script and must be edited for your local setup.
TODO: update to a Python script instead of bash.
- `src/common/software/ghidra/GhidraCommunication.ts` — singleton WebSocket client on the Electron side that talks to `bridge.py`.

Protocol (renderer → Python, over WebSocket):

- `"use_ghidra"` — launches Ghidra via `headlessGhidra.bash`, then repeatedly attempts to connect to the in-Ghidra `ghidra_bridge` server until it reports `connected`.
- any digit string — interpreted as an address; forwarded to Ghidra via `flat_api.goTo(addr)`.

Python → renderer messages: `"connected"` / `"disconnected"` (status heartbeat, emitted every second once a connection is established). These drive the `ghidraConnectedStep1/2` and `ghidraDisconnectedStep1/2` events exposed on `window.api`.

Prerequisites on the host:

- Ghidra installed (the path is hardcoded in `headlessGhidra.bash`; edit to match your installation).
- The `ghidra_bridge` server script running inside Ghidra's Jython console so that the Python side can attach to it.
- Python dependencies from `requirements.txt` (`ghidra-bridge`, `jfx-bridge`, `websockets`), installed by `init.bash` into the local venv.

## Trace file format

Traces are JSON files with the following top-level shape:

```json
{
  "processes": [
    { "name": "...", "pid": 0 }
  ],
  "resources": [
    { "path": "...", "resource_type": 4 }
  ],
  "events": [
    {
      "timestamp": 0,
      "process": "p:0",
      "event_type": "...",
      "source_entities": ["r:0"],
      "target_entities": [],
      "input_values": {},
      "output_values": {},
      "description": "..."
    }
  ],
  "_extensions": [
    { "tag": "...", "data": {} }
  ]
}
```

Entity references inside events use index-based strings: `"p:N"` refers to `processes[N]`, `"r:N"` refers to `resources[N]`.

`resource_type` is an integer enum; value `4` is a regular file. Other resource kinds (FIFO, STDIO, etc.) use distinct values; see `src/common/types.ts`.

`_extensions` is an optional array of tagged extension payloads applied at import time. Extensions can enrich the trace (for example merging or splitting events, overriding edge direction, or assigning colors). A handful of static extensions run unconditionally on every import; tagged extensions (e.g. `EventColors`) are opt-in and activated by the presence of their tag in this array. Extension implementations live under `src/common/ExecutionTrace/` and are registered in `ImporterExtensionsGlobals.ts`.

## Tests

Unit tests live under `tests/common/` and cover the core data-flow primitives: `DataChunk`, `FIFOStorageStrategy`, `FileStorageStrategy`, `CausalProperty`, and `EventPattern`.

```bash
$ npm run test:run    # single run
$ npm run test:watch  # watch mode
```

See `tests/README.md` for the scope and intent of the test suite.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for the full text.
