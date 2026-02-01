const fs = require('fs');
const path = require('path');

const PAC_ROOT = '_pokemonAutoChess';
const CONFIGS_PATH = path.join(PAC_ROOT, 'app/config/game');

/**
 * Parse town encounters config
 */
function parseTownEncounters(configPath, pokemonData) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract TownEncounterSellPrice
  const sellPriceMatch = content.match(/export const TownEncounterSellPrice[^=]*=\s*{([^}]*)}/s);
  const sellPrices = {};
  
  if (sellPriceMatch) {
    const priceContent = sellPriceMatch[1];
    const priceRegex = /\[Pkm\.(\w+)\]:\s*(\d+)/g;
    let match;
    
    while ((match = priceRegex.exec(priceContent)) !== null) {
      const pokemonName = match[1];
      const price = parseInt(match[2]);
      sellPrices[pokemonName] = price;
    }
  }
  
  // Extract TownEncountersByStage
  const stageMatch = content.match(/export const TownEncountersByStage[^=]*=\s*{([\s\S]*?)^}/m);
  const encountersByStage = {};
  
  if (stageMatch) {
    const stageContent = stageMatch[1];
    
    // Match each stage block
    const stageRegex = /(\d+):\s*{([^}]*)}/g;
    let stageBlockMatch;
    
    while ((stageBlockMatch = stageRegex.exec(stageContent)) !== null) {
      const stageLevel = parseInt(stageBlockMatch[1]);
      const encountersContent = stageBlockMatch[2];
      
      const encounters = {};
      const encounterRegex = /\[Pkm\.(\w+)\]:\s*([\d\s\/\.]+)/g;
      let encounterMatch;
      
      while ((encounterMatch = encounterRegex.exec(encountersContent)) !== null) {
        const pokemonName = encounterMatch[1];
        const probabilityStr = encounterMatch[2].trim();
        
        // Evaluate the probability expression (e.g., "1 / 20" or "1 / 40")
        let probability;
        if (probabilityStr.includes('/')) {
          const [num, denom] = probabilityStr.split('/').map(s => parseFloat(s.trim()));
          probability = num / denom;
        } else {
          probability = parseFloat(probabilityStr);
        }
        
        encounters[pokemonName] = {
          probability: probability,
          percentage: (probability * 100).toFixed(2) + '%'
        };
      }
      
      encountersByStage[stageLevel] = encounters;
    }
  }
  
  // Extract constants
  const outlawGoldMatch = content.match(/export const OUTLAW_GOLD_REWARD\s*=\s*(\d+)/);
  const outlawGoldReward = outlawGoldMatch ? parseInt(outlawGoldMatch[1]) : null;
  
  const treasureBoxMatch = content.match(/export const TREASURE_BOX_LIFE_THRESHOLD\s*=\s*(\d+)/);
  const treasureBoxLifeThreshold = treasureBoxMatch ? parseInt(treasureBoxMatch[1]) : null;
  
  // Extract treasure box rewards
  const treasureBoxRewardsMatch = content.match(/randomWeighted<TreasureBoxReward>\({([^}]*)}\)/s);
  const treasureBoxRewards = {};
  
  if (treasureBoxRewardsMatch) {
    const rewardsContent = treasureBoxRewardsMatch[1];
    const rewardRegex = /(\w+):\s*([\d\.]+)/g;
    let rewardMatch;
    
    while ((rewardMatch = rewardRegex.exec(rewardsContent)) !== null) {
      const rewardType = rewardMatch[1];
      const weight = parseFloat(rewardMatch[2]);
      treasureBoxRewards[rewardType] = {
        weight: weight,
        percentage: (weight * 100).toFixed(1) + '%'
      };
    }
  }
  
  return {
    sellPrices,
    encountersByStage,
    constants: {
      outlawGoldReward,
      treasureBoxLifeThreshold
    },
    treasureBoxRewards
  };
}

/**
 * Parse synergies config
 */
function parseSynergies(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract SynergyTriggers
  const triggersMatch = content.match(/export const SynergyTriggers[^=]*=\s*{([\s\S]*?)^}/m);
  const synergyTriggers = {};
  
  if (triggersMatch) {
    const triggersContent = triggersMatch[1];
    const triggerRegex = /\[Synergy\.(\w+)\]:\s*\[([^\]]+)\]/g;
    let match;
    
    while ((match = triggerRegex.exec(triggersContent)) !== null) {
      const synergyName = match[1];
      const levels = match[2].split(',').map(n => parseInt(n.trim()));
      synergyTriggers[synergyName] = levels;
    }
  }
  
  // Extract FishRarityProbability
  const fishMatch = content.match(/export const FishRarityProbability[^=]*=\s*{([\s\S]*?)^}/m);
  const fishRarityProbability = {};
  
  if (fishMatch) {
    const fishContent = fishMatch[1];
    const rodRegex = /\[Item\.(\w+)\]:\s*{([^}]*)}/g;
    let rodMatch;
    
    while ((rodMatch = rodRegex.exec(fishContent)) !== null) {
      const rodName = rodMatch[1];
      const raritiesContent = rodMatch[2];
      const rarities = {};
      
      const rarityRegex = /\[Rarity\.(\w+)\]:\s*([\d\.]+)/g;
      let rarityMatch;
      
      while ((rarityMatch = rarityRegex.exec(raritiesContent)) !== null) {
        const rarityName = rarityMatch[1];
        const probability = parseFloat(rarityMatch[2]);
        rarities[rarityName] = {
          probability: probability,
          percentage: (probability * 100).toFixed(1) + '%'
        };
      }
      
      fishRarityProbability[rodName] = rarities;
    }
  }
  
  // Extract constants
  const constants = {};
  const constantRegex = /export const (\w+)\s*=\s*([\d\.]+)/g;
  let constantMatch;
  
  while ((constantMatch = constantRegex.exec(content)) !== null) {
    const name = constantMatch[1];
    const value = parseFloat(constantMatch[2]);
    constants[name] = value;
  }
  
  // Extract synergy colors
  const colorsMatch = content.match(/export const SYNERGY_COLORS[^=]*=\s*{([\s\S]*?)^}/m);
  const synergyColors = {};
  
  if (colorsMatch) {
    const colorsContent = colorsMatch[1];
    const colorRegex = /(\w+):\s*"([^"]+)"/g;
    let colorMatch;
    
    while ((colorMatch = colorRegex.exec(colorsContent)) !== null) {
      synergyColors[colorMatch[1]] = colorMatch[2];
    }
  }
  
  return {
    synergyTriggers,
    fishRarityProbability,
    synergyColors,
    constants
  };
}

/**
 * Parse stages config
 */
function parseStages(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract StageDuration
  const durationMatch = content.match(/export const StageDuration[^=]*=\s*{([\s\S]*?)^}/m);
  const stageDuration = {};
  
  if (durationMatch) {
    const durationContent = durationMatch[1];
    const stageRegex = /(\w+):\s*(\d+)/g;
    let match;
    
    while ((match = stageRegex.exec(durationContent)) !== null) {
      const stage = match[1] === 'DEFAULT' ? 'DEFAULT' : parseInt(match[1]);
      const duration = parseInt(match[2]);
      stageDuration[stage] = duration;
    }
  }
  
  // Extract constants
  const constants = {};
  const constantRegex = /export const (\w+)\s*=\s*(\d+)/g;
  let constantMatch;
  
  while ((constantMatch = constantRegex.exec(content)) !== null) {
    const name = constantMatch[1];
    if (name !== 'StageDuration') {
      constants[name] = parseInt(constantMatch[2]);
    }
  }
  
  // Extract stage arrays
  const arrayRegex = /export const (\w+Stages)\s*=\s*\[([^\]]+)\]/g;
  let arrayMatch;
  
  while ((arrayMatch = arrayRegex.exec(content)) !== null) {
    const name = arrayMatch[1];
    const values = arrayMatch[2].split(',').map(n => parseInt(n.trim()));
    constants[name] = values;
  }
  
  return {
    stageDuration,
    ...constants
  };
}

/**
 * Parse shop config
 */
function parseShop(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract simple constants
  const constants = {};
  const constantRegex = /export const (\w+)\s*=\s*(\d+)/g;
  let constantMatch;
  
  while ((constantMatch = constantRegex.exec(content)) !== null) {
    constants[constantMatch[1]] = parseInt(constantMatch[2]);
  }
  
  // Extract rarity mappings
  const extractRarityObject = (objectName) => {
    const match = content.match(new RegExp(`export const ${objectName}[^=]*=\\s*Object\\.freeze\\({([^}]*)\\}\\)`, 's'));
    if (!match) {
      // Try without Object.freeze
      const match2 = content.match(new RegExp(`export const ${objectName}[^=]*=\\s*{([^}]*)\\}`, 's'));
      if (!match2) return {};
      const objContent = match2[1];
      const result = {};
      const regex = /\[Rarity\.(\w+)\]:\s*([\d\.]+|"[^"]*")/g;
      let m;
      while ((m = regex.exec(objContent)) !== null) {
        const value = m[2].replace(/"/g, '');
        result[m[1]] = isNaN(value) ? value : parseFloat(value);
      }
      return result;
    }
    
    const objContent = match[1];
    const result = {};
    const regex = /\[Rarity\.(\w+)\]:\s*([\d\.]+|"[^"]*")/g;
    let m;
    
    while ((m = regex.exec(objContent)) !== null) {
      const value = m[2].replace(/"/g, '');
      result[m[1]] = isNaN(value) ? value : parseFloat(value);
    }
    
    return result;
  };
  
  // Extract RarityProbabilityPerLevel
  const probMatch = content.match(/export const RarityProbabilityPerLevel[^=]*=\s*{([\s\S]*?)^}/m);
  const rarityProbabilityPerLevel = {};
  
  if (probMatch) {
    const probContent = probMatch[1];
    const levelRegex = /(\d+):\s*\[([^\]]+)\]/g;
    let match;
    
    while ((match = levelRegex.exec(probContent)) !== null) {
      const level = parseInt(match[1]);
      const probs = match[2].split(',').map(n => parseFloat(n.trim()));
      rarityProbabilityPerLevel[level] = probs;
    }
  }
  
  // Extract special rates
  const rateRegex = /export const (\w+_RATE(?:_\w+)?)\s*=\s*([\d\/\s]+)/g;
  const specialRates = {};
  let rateMatch;
  
  while ((rateMatch = rateRegex.exec(content)) !== null) {
    const name = rateMatch[1];
    const valueStr = rateMatch[2].trim();
    let value;
    
    if (valueStr.includes('/')) {
      const [num, denom] = valueStr.split('/').map(s => parseFloat(s.trim()));
      value = num / denom;
    } else {
      value = parseFloat(valueStr);
    }
    
    specialRates[name] = {
      value: value,
      percentage: (value * 100).toFixed(2) + '%'
    };
  }
  
  return {
    constants,
    rarityHpCost: extractRarityObject('RarityHpCost'),
    rarityCost: extractRarityObject('RarityCost'),
    rarityColor: extractRarityObject('RarityColor'),
    boosterRarityProbability: extractRarityObject('BoosterRarityProbability'),
    rarityProbabilityPerLevel,
    specialRates
  };
}

/**
 * Parse pools config
 */
function parsePools(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract PoolSize
  const poolSizeMatch = content.match(/export const PoolSize[^=]*=\s*{([\s\S]*?)^}/m);
  const poolSize = {};
  
  if (poolSizeMatch) {
    const poolContent = poolSizeMatch[1];
    const rarityRegex = /\[Rarity\.(\w+)\]:\s*\[([^\]]+)\]/g;
    let match;
    
    while ((match = rarityRegex.exec(poolContent)) !== null) {
      const rarity = match[1];
      const sizes = match[2].split(',').map(n => parseInt(n.trim()));
      poolSize[rarity] = sizes;
    }
  }
  
  // Extract pool arrays
  const extractPool = (poolName) => {
    const match = content.match(new RegExp(`export const ${poolName}\\s*=\\s*new Array<[^>]+>\\(([\\s\\S]*?)\\)`, 'm'));
    if (!match) return [];
    
    const poolContent = match[1];
    const pokemon = [];
    const pkmnRegex = /Pkm(?:Duo)?\.(\w+)/g;
    let pkmnMatch;
    
    while ((pkmnMatch = pkmnRegex.exec(poolContent)) !== null) {
      pokemon.push(pkmnMatch[1]);
    }
    
    return pokemon;
  };
  
  return {
    poolSize,
    uniquePool: extractPool('UniquePool'),
    legendaryPool: extractPool('LegendaryPool')
  };
}

/**
 * Parse other simple config files
 */
function parseSimpleConfig(configPath, configName) {
  const content = fs.readFileSync(configPath, 'utf-8');
  const result = {};
  
  // Extract constants
  const constantRegex = /export const (\w+)\s*=\s*([\d\.]+|true|false)/g;
  let constantMatch;
  
  while ((constantMatch = constantRegex.exec(content)) !== null) {
    const name = constantMatch[1];
    const value = constantMatch[2];
    
    if (value === 'true') result[name] = true;
    else if (value === 'false') result[name] = false;
    else result[name] = parseFloat(value);
  }
  
  // Extract objects
  const objectRegex = /export const (\w+)(?:[^=]*=\s*Object\.freeze\()?[^=]*=\s*{([^}]*)}/gs;
  let objectMatch;
  
  while ((objectMatch = objectRegex.exec(content)) !== null) {
    const objName = objectMatch[1];
    const objContent = objectMatch[2];
    const obj = {};
    
    // Try to parse key-value pairs
    const kvRegex = /\[?(\w+)\.?(\w+)?\]?:\s*([\d\.]+|"[^"]*"|\[[\d\s,]+\])/g;
    let kvMatch;
    
    while ((kvMatch = kvRegex.exec(objContent)) !== null) {
      const key = kvMatch[2] || kvMatch[1];
      let value = kvMatch[3];
      
      if (value.startsWith('[')) {
        value = value.slice(1, -1).split(',').map(n => parseFloat(n.trim()));
      } else if (value.startsWith('"')) {
        value = value.slice(1, -1);
      } else {
        value = parseFloat(value);
      }
      
      obj[key] = value;
    }
    
    if (Object.keys(obj).length > 0) {
      result[objName] = obj;
    }
  }
  
  return result;
}

/**
 * Main processing function
 */
function processConfigs(pokemonData) {
  const configs = {};
  
  // Process town encounters
  const townEncountersPath = path.join(CONFIGS_PATH, 'town-encounters.ts');
  if (fs.existsSync(townEncountersPath)) {
    configs.townEncounters = parseTownEncounters(townEncountersPath, pokemonData);
    console.log('✓ Processed town encounters config');
  }
  
  // Process synergies
  const synergiesPath = path.join(CONFIGS_PATH, 'synergies.ts');
  if (fs.existsSync(synergiesPath)) {
    configs.synergies = parseSynergies(synergiesPath);
    console.log('✓ Processed synergies config');
  }
  
  // Process stages
  const stagesPath = path.join(CONFIGS_PATH, 'stages.ts');
  if (fs.existsSync(stagesPath)) {
    configs.stages = parseStages(stagesPath);
    console.log('✓ Processed stages config');
  }
  
  // Process shop
  const shopPath = path.join(CONFIGS_PATH, 'shop.ts');
  if (fs.existsSync(shopPath)) {
    configs.shop = parseShop(shopPath);
    console.log('✓ Processed shop config');
  }
  
  // Process pools
  const poolsPath = path.join(CONFIGS_PATH, 'pools.ts');
  if (fs.existsSync(poolsPath)) {
    configs.pools = parsePools(poolsPath);
    console.log('✓ Processed pools config');
  }
  
  // Process simple configs
  const simpleConfigs = [
    'pokemons',
    'items', 
    'game',
    'experience',
    'events',
    'elo',
    'collection',
    'board',
    'battle'
  ];
  
  for (const configName of simpleConfigs) {
    const configPath = path.join(CONFIGS_PATH, `${configName}.ts`);
    if (fs.existsSync(configPath)) {
      configs[configName] = parseSimpleConfig(configPath, configName);
      console.log(`✓ Processed ${configName} config`);
    }
  }
  
  return configs;
}

module.exports = {
  processConfigs
};