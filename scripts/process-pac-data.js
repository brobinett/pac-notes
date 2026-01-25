#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import PAC's PkmIndex enum
const PAC_ROOT = '_pokemonAutoChess/app/types/enum';
const PkmIndexPath = path.join(PAC_ROOT, 'Pokemon.ts');

// Read and parse the PkmIndex from TypeScript
function extractPkmIndex() {
  const content = fs.readFileSync(PkmIndexPath, 'utf-8');
  
  // Extract the PkmIndex object using regex
  const match = content.match(/export const PkmIndex.*?= {([\s\S]*?)^}/m);
  if (!match) throw new Error('Could not find PkmIndex in Pokemon.ts');
  
  const indexContent = match[1];
  const pokemonMap = {};
  
  // Parse each line like: [Pkm.CHARIZARD]: "0006",
  const lineRegex = /\[Pkm\.(\w+)\]:\s*"([^"]+)"/g;
  let lineMatch;
  
  while ((lineMatch = lineRegex.exec(indexContent)) !== null) {
    const name = lineMatch[1];
    const index = lineMatch[2];
    pokemonMap[name] = index;
  }
  
  return pokemonMap;
}

// Copy specific pokemon portraits
function copyPortrait(name, index) {
  const sourcePath = path.join(
    '_pokemonAutoChess/app/public/src/assets/portraits',
    index,
    'Normal.png'
  );
  
  const destDir = 'assets/images/portraits';
  const destPath = path.join(destDir, `${name}.png`);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    return true;
  }
  return false;
}

// Main function
function main() {
  console.log('Processing PAC data...');
  
  const pkmIndex = extractPkmIndex();
  
  // Generate Jekyll data file
  const dataDir = '_data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  fs.writeFileSync(
    path.join(dataDir, 'pokemon.json'),
    JSON.stringify(pkmIndex, null, 2)
  );
  
  console.log(`Generated _data/pokemon.json with ${Object.keys(pkmIndex).length} pokemon`);
  
  // Copy portraits for pokemon we want
  // For now, let's copy a subset - you can expand this list
  const pokemonToCopy = [
    'CHARIZARD', 'BULBASAUR', 'SQUIRTLE', 'PIKACHU', 
    'MEWTWO', 'GYARADOS', 'DRAGONITE'
  ];
  
  let copied = 0;
  for (const name of pokemonToCopy) {
    if (pkmIndex[name]) {
      if (copyPortrait(name, pkmIndex[name])) {
        copied++;
      }
    }
  }
  
  console.log(`Copied ${copied} pokemon portraits`);
}

main();
