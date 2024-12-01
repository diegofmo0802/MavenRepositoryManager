#!/bin/bash
set -e
remove_build_dir() {
    if [ -d "$1" ]; then
        echo "Removing $1"
        rm -rf "$1"
    fi
}

./dependencies.bash

remove_build_dir "build"
remove_build_dir "client/logic/build"
remove_build_dir "pwa/worker/build"

echo "Building server"
npm install && npx tsc

echo "Building client"
(
    cd client/logic || exit
    npm install && npx tsc
)

echo "Building worker"
(
    cd pwa/worker || exit
    npm install && npx tsc
)

echo "Build completed successfully"