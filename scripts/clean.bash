#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

rm -rf ${SCRIPT_DIR}/node_modules
rm -rf ${SCRIPT_DIR}/venv

echo "All dependencies have been removed. You can run init.bash to setup the project again."