#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processPokemon } = require('./processors/pokemon-processor');
const { processConfigs } = require('./processors/config-processor');

// Main function
async function main() {
  console.log('=== Processing PAC data ===\n');
  
  // Ensure _data directory exists
  const dataDir = '_data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  // Process Pokemon data
  const pokemonResult = await processPokemon();
  
  // Save pokemon data
  fs.writeFileSync(
    path.join(dataDir, 'pokemon.json'),
    JSON.stringify(pokemonResult.pokemon, null, 2)
  );
  console.log(`✓ Generated _data/pokemon.json with enriched data`);
  
  // Save stat ranges
  fs.writeFileSync(
    path.join(dataDir, 'stat_ranges.json'),
    JSON.stringify(pokemonResult.statRanges, null, 2)
  );
  console.log(`✓ Generated _data/stat_ranges.json\n`);
  
  // Process config files
  const configs = processConfigs(pokemonResult.pokemon);
  
  // Save individual config files with _config suffix
  for (const [configName, configData] of Object.entries(configs)) {
    const filename = configName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + '_config.json';
    fs.writeFileSync(
      path.join(dataDir, filename),
      JSON.stringify(configData, null, 2)
    );
    console.log(`✓ Generated _data/${filename}`);
  }
  
  console.log('\n=== Processing complete! ===');
}

main().catch(console.error);