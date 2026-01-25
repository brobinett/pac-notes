#!/bin/bash

# Exit on error
set -e

echo "Copying PAC assets..."

# Create directories
mkdir -p assets/images/portraits
mkdir -p assets/images/types
mkdir -p assets/images/items

# Copy assets from submodule
cp -r _pokemonAutoChess/app/public/src/assets/portraits/* assets/images/portraits/
cp -r _pokemonAutoChess/app/public/src/assets/types{tps}/* assets/images/types/
cp -r _pokemonAutoChess/app/public/src/assets/item{tps}/* assets/images/items/

echo "Assets copied successfully!"
```

### Step 3: Update workflows and add to .gitignore

Add to `.gitignore`:
```
assets/images/portraits/
assets/images/types/
assets/images/items/
