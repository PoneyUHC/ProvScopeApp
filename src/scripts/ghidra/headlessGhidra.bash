#!/bin/bash

PROJECT_NAME=testProject
PROJECT_DIR=~/Documents/ghidraProjects
GHIDRA_DIR=~/Documents/ghidraProjects/ghidra_11.4_PUBLIC_20250620/ghidra_11.4_PUBLIC
BIN_FILE=test_file
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
    "$GHIDRA_DIR/ghidraRun" "$PROJECT_DIR/$PROJECT_NAME.gpr"
else
    echo "Error : no project existing."
fi