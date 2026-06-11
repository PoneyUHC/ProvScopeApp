#!/bin/bash

setup() {
    echo "Installing React app dependencies"
    npm install

    echo "Creating local venv and installing Python dependencies"
    python3 -m venv ./venv
    source ./venv/bin/activate
    pip install -r ./requirements.txt
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