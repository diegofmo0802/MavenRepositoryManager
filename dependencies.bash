#!/bin/bash
set -e

remove_build_dir() {
    if [ -d "$1" ]; then
        echo "Removing $1"
        rm -rf "$1"
    fi
}

clone_or_pull() {
    REPO=$1
    DIR=$2

    if [ -d "$DIR" ]; then
        echo "Updating $DIR"
        cd "$DIR"
        git pull || { echo "Failed to update $DIR"; exit 1; }
        cd ..
    else
        echo "Cloning $REPO into $DIR"
        git clone "$REPO" "$DIR" || { echo "Failed to clone $REPO"; exit 1; }
    fi
}

DB_REPO="https://github.com/diegofmo0802/db-manager.git"
WEBAPP_REPO="https://github.com/diegofmo0802/WebApp.git"
QRCODE_REPO="https://github.com/diegofmo0802/QR-Code.git"

DB_OUT=src/DBManager
WEBAPP_OUT=client/logic/src/WebApp
QRCODE_OUT=client/logic/src/QR-Code
QRCODE_OUT2=src/QR-Code

remove_build_dir $DB_OUT
remove_build_dir $WEBAPP_OUT
remove_build_dir $QRCODE_OUT

clone_or_pull "$DB_REPO" ".DBManager"
clone_or_pull "$WEBAPP_REPO" ".WebApp"
clone_or_pull "$QRCODE_REPO" ".QR-Code"

(
    echo "Injecting dependency files from DBManager"
    mkdir -p $(dirname $DB_OUT)
    cp -r .DBManager/src "$DB_OUT"

    echo "Injecting dependency files from WebApp"
    mkdir -p $(dirname $WEBAPP_OUT)
    cp -r .WebApp/src "$WEBAPP_OUT"

    echo "Injecting dependency files from QR-Code"
    mkdir -p $(dirname $QRCODE_OUT)
    mkdir -p $(dirname $QRCODE_OUT2)
    cp -r .QR-Code/src "$QRCODE_OUT"
    cp -r .QR-Code/src "$QRCODE_OUT2"
)

echo "Dependencies injection completed successfully"
