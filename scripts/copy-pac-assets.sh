#!/bin/bash

set -e

echo "Copying PAC assets..."

# Run the Node.js script to process data and copy selective portraits
node scripts/process-pac-data.js

# Copy all type icons
mkdir -p assets/images/types
cp -r _pokemonAutoChess/app/public/src/assets/types{tps}/* assets/images/types/

# Copy all item icons
mkdir -p assets/images/items
cp -r _pokemonAutoChess/app/public/src/assets/item{tps}/* assets/images/items/

echo "Assets copied successfully!"
