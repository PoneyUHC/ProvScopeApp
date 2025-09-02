#!/bin/bash

setup() {
    echo "Installing React app dependencies"
    npm install

    echo "Installing Python dependencies"
    python3 -m venv ./venv
    source ./venv/bin/activate
    pip install -r ./requirements.txt
}

ASK="Would you like to download and setup dependencies for this project ? (Y/n) "
read -p "$ASK" -r
if [[ "$REPLY" =~ ^[Yy]$ || "$REPLY" == "" ]]
then
    setup
fi