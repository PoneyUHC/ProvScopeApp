#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR=$(dirname ${SCRIPT_DIR})

setup() {

    echo "Installing application dependencies"
    cd ${ROOT_DIR}
    npm install
    cd ${SCRIPT_DIR}

    echo "Creating local venv and installing Python dependencies"
    python3 -m venv ${SCRIPT_DIR}/venv
    source ${SCRIPT_DIR}/venv/bin/activate
    pip install -r ${SCRIPT_DIR}/requirements.txt
    pip install -e .
}

ASK="Would you like to download and setup dependencies for this project ? (Y/n) "
read -p "$ASK" -r
if [[ "$REPLY" =~ ^[Yy]$ || "$REPLY" == "" ]]
then
    setup
else
    echo "Aborting setup. Please run this script again to setup dependencies when you are ready."
fi