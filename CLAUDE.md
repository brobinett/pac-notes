# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll documentation site for Pokemon Auto Chess (PAC) game analysis and strategy guides. The actual PAC game source code lives in the `_pokemonAutoChess/` git submodule and is used to extract data for the documentation.

## Common Commands

### Documentation Site (Jekyll)

```bash
# Install dependencies
bundle install

# Serve locally at localhost:4000
bundle exec jekyll serve

# Build for production (output in _site/)
bundle exec jekyll build
```

### Data Processing

```bash
# Initialize/update PAC submodule
git submodule update --init

# Copy assets and process data from PAC submodule
./scripts/copy-pac-assets.sh

# Clean copied assets
./scripts/clean-pac-assets.sh
```

## Architecture

### Data Flow

1. `_pokemonAutoChess/` submodule contains the game source
2. `scripts/process-pac-data.js` extracts Pokemon stats, items, synergies, and other config data
3. Processed data is written to `_data/*.json` files
4. Jekyll templates in `pages/` render the data as documentation pages
5. Portraits and icons are copied to `assets/images/`

### Key Directories

- `pages/comps/` - Team composition guides organized by synergy type
- `pages/mechanics/` - Game mechanics documentation
- `scripts/processors/` - Node.js data extraction scripts
- `_data/` - Generated JSON files consumed by Jekyll templates
- `assets/images/` - Copied portraits, type icons, and item icons

### Data Processors

- `pokemon-processor.js` - Extracts Pokemon stats from CSV and index mappings from TypeScript, copies portraits
- `config-processor.js` - Processes game configs (items, synergies, stages, weather, etc.)

## CI/CD

GitHub Actions workflows:
- `ci.yml` - Validates Jekyll build on PRs
- `pages.yml` - Deploys to GitHub Pages on push to main (copies PAC assets, builds Jekyll)
