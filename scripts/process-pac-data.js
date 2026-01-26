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

// Copy all pokemon portraits
function copyAllPortraits(pkmIndex) {
  const destDir = 'assets/images/portraits';
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  let copied = 0;
  let skipped = 0;
  const missing = [];
  
  for (const [name, index] of Object.entries(pkmIndex)) {
    // Convert index format: "0019-0001" becomes "0019/0001"
    const pathIndex = index.replace('-', '/');
    
    const sourcePath = path.join(
      '_pokemonAutoChess/app/public/src/assets/portraits',
      pathIndex,
      'Normal.png'
    );
    
    const destPath = path.join(destDir, `${name}.png`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      copied++;
    } else {
      skipped++;
      missing.push({ name, index, path: sourcePath });
    }
  }
  
  return { copied, skipped, missing };
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
  
  console.log(`✓ Generated _data/pokemon.json with ${Object.keys(pkmIndex).length} pokemon`);
  
  // Copy all portraits
  const { copied, skipped, missing } = copyAllPortraits(pkmIndex);
  console.log(`✓ Copied ${copied} pokemon portraits (${skipped} not found)`);
  
  if (missing.length > 0 && missing.length <= 20) {
    console.log('\nMissing portraits:');
    missing.forEach(m => console.log(`  - ${m.name} (${m.index})`));
  } else if (missing.length > 20) {
    console.log(`\nFirst 20 missing portraits:`);
    missing.slice(0, 20).forEach(m => console.log(`  - ${m.name} (${m.index})`));
    console.log(`  ... and ${missing.length - 20} more`);
    
    // Write full list to file
    fs.writeFileSync(
      'missing-portraits.txt',
      missing.map(m => `${m.name} (${m.index}): ${m.path}`).join('\n')
    );
    console.log('\nFull list written to missing-portraits.txt');
  }
}

main();
