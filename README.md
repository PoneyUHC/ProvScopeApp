
# IPCA_APP (name to be found)

Application to explore and analyze execution trace of inter-process systems.
Expects to be used on outputs of IPC_Analyzer ()


## Project Setup

Easy setup is possible through `init.bash` script. After initialization, you should activate the python venv in your shell.

```bash
./init.bash
source ./venv/bin/activate
```

This script will create a python venv with the proper modules and activate it under the current shell.
It will also download the necessary dependencies for both the Python and the React codebases.

To clear the configuration, use `clean.bash` script
```bash
./clean.bash
```


## Application architecture

The application was originally a web-based application, using React as the development framework.
The idea was to have a portable application, with a fast development cycle over a well-known framework.
After encountering typical problems for a web app (among which host-system interaction restrictions), I decided to make the app a desktop app.
To minimize the development impact, Electron seemed like a good choice, allowing to migrate directly from a web-app to a desktop app, while keeping the exact same code.

Electron acts as the englobing process, which can have normal-process interactions with the underlying system (typically reading files from the file system).
It wraps the render thread (the react web app), which handles all the rendering of the application and the user interactions.


## Ghidra integration

To be documented



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

