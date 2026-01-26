#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// PAC submodule paths
const PAC_ROOT = '_pokemonAutoChess';
const POKEMON_INDEX_PATH = path.join(PAC_ROOT, 'app/types/enum/Pokemon.ts');
const POKEMON_DATA_CSV_PATH = path.join(PAC_ROOT, 'app/models/precomputed/pokemons-data.csv');
const PORTRAITS_PATH = path.join(PAC_ROOT, 'app/public/src/assets/portraits');

// Parse CSV
async function parsePokemonCSV() {
  const fileStream = fs.createReadStream(POKEMON_DATA_CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const pokemons = {};
  let headers = [];
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(',');
      isFirstLine = false;
      continue;
    }

    const values = line.split(',');
    const pokemon = {};
    
    headers.forEach((header, i) => {
      pokemon[header.trim()] = values[i]?.trim() || '';
    });

    const name = pokemon.Name?.toUpperCase();
    if (name) {
      pokemons[name] = pokemon;
    }
  }

  return pokemons;
}

// Calculate percentile for an array of numbers
function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Calculate stat ranges using percentiles
function calculateStatRanges(pokemons) {
  const stats = ['HP', 'Attack', 'Speed', 'Defense', 'Special Defense', 'Max PP'];
  const ranges = {};
  
  stats.forEach(stat => {
    const values = Object.values(pokemons)
      .map(p => parseInt(p[stat]) || 0)
      .filter(v => v > 0);  // Ignore 0 values
    
    ranges[stat] = {
      min: Math.min(...values),
      max: Math.max(...values),
      p95: Math.round(percentile(values, 95)),  // 95th percentile
      p50: Math.round(percentile(values, 50))   // Median
    };
  });
  
  return ranges;
}

// Extract PkmIndex from TypeScript
function extractPkmIndex() {
  const content = fs.readFileSync(POKEMON_INDEX_PATH, 'utf-8');
  
  const match = content.match(/export const PkmIndex.*?= {([\s\S]*?)^}/m);
  if (!match) throw new Error('Could not find PkmIndex in Pokemon.ts');
  
  const indexContent = match[1];
  const pokemonMap = {};
  
  const lineRegex = /\[Pkm\.(\w+)\]:\s*"([^"]+)"/g;
  let lineMatch;
  
  while ((lineMatch = lineRegex.exec(indexContent)) !== null) {
    const name = lineMatch[1];
    const index = lineMatch[2];
    pokemonMap[name] = { index };
  }
  
  return pokemonMap;
}

// Copy pokemon portraits
function copyAllPortraits(pkmIndex) {
  const destDir = 'assets/images/portraits';
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  let copied = 0;
  let skipped = 0;
  
  for (const [name, data] of Object.entries(pkmIndex)) {
    const pathIndex = data.index.replace('-', '/');
    
    const sourcePath = path.join(PORTRAITS_PATH, pathIndex, 'Normal.png');
    const destPath = path.join(destDir, `${name}.png`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      copied++;
    } else {
      skipped++;
    }
  }
  
  return { copied, skipped };
}

// Main function
async function main() {
  console.log('Processing PAC data...');
  
  // Get index data
  const pkmIndex = extractPkmIndex();
  console.log(`✓ Extracted ${Object.keys(pkmIndex).length} pokemon from PkmIndex`);
  
  // Get CSV stats
  const pokemonStats = await parsePokemonCSV();
  console.log(`✓ Parsed ${Object.keys(pokemonStats).length} pokemon from CSV`);
  
  // Calculate stat ranges
  const statRanges = calculateStatRanges(pokemonStats);
  console.log('\n✓ Stat ranges (min / median / 95th percentile / max):');
  Object.entries(statRanges).forEach(([stat, range]) => {
    console.log(`  ${stat}: ${range.min} / ${range.p50} / ${range.p95} / ${range.max}`);
  });
  
  // Merge data
  for (const [name, indexData] of Object.entries(pkmIndex)) {
    if (pokemonStats[name]) {
      pkmIndex[name] = {
        ...indexData,
        ...pokemonStats[name]
      };
    }
  }
  
  // Generate Jekyll data files
  const dataDir = '_data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  // Save pokemon data
  fs.writeFileSync(
    path.join(dataDir, 'pokemon.json'),
    JSON.stringify(pkmIndex, null, 2)
  );
  
  // Save stat ranges for use in templates
  fs.writeFileSync(
    path.join(dataDir, 'stat_ranges.json'),
    JSON.stringify(statRanges, null, 2)
  );
  
  console.log(`\n✓ Generated _data/pokemon.json with enriched data`);
  console.log(`✓ Generated _data/stat_ranges.json`);
  
  // Copy portraits
  const { copied, skipped } = copyAllPortraits(pkmIndex);
  console.log(`✓ Copied ${copied} pokemon portraits (${skipped} not found)`);
}

main().catch(console.error);