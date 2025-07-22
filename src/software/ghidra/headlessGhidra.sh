#!/bin/bash

PROJECT_NAME=testProjectVersion2
PROJECT_DIR=~/ghidraProj
GHIDRA_DIR=~/Apps/ghidra_11.0.2_PUBLIC
BIN_FILE=ls
PROJECT_PATH="$PROJECT_DIR/$PROJECT_NAME.rep"
PROJECT_GPR="$PROJECT_DIR/$PROJECT_NAME.gpr"

if [ ! -d "$PROJECT_PATH" ];
then
    echo "Creating a Ghidra project."
    echo "Analysing the binary file."
    "$GHIDRA_DIR/support/analyzeHeadless" "$PROJECT_DIR" "$PROJECT_NAME" -import "$PROJECT_DIR/$BIN_FILE"
fi

if [ -f "$PROJECT_GPR" ];
then
    echo "Launching Ghidra on the project."
    #"$GHIDRA_DIR/ghidraRun" ghidra.GhidraRun "$PROJECT_GPR" -process "$BIN_FILE" (open the binary file inside the project)
    "$GHIDRA_DIR/ghidraRun" "$PROJECT_DIR/$PROJECT_NAME.gpr"
else
    echo "Error : no project existing."
fi