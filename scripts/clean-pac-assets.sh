#!/bin/bash

set -e

echo "Cleaning copied PAC assets..."

# Remove copied asset directories
rm -rf assets/images/portraits
rm -rf assets/images/types
rm -rf assets/images/items

# Remove generated data file
rm -f _data/pokemon.json

echo "✓ Cleaned all copied PAC assets and generated data"
