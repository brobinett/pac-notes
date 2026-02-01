#!/bin/bash

set -e

echo "Cleaning copied PAC assets..."

# Remove copied asset directories
rm -rf assets/images/portraits
rm -rf assets/images/types
rm -rf assets/images/items

# Remove generated data files
rm -f _data/pokemon.json
rm -f _data/stat_ranges.json

# Remove all generated config files
rm -f _data/*_config.json

echo "✓ Cleaned all copied PAC assets and generated data"