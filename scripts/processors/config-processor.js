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
 * Parse dishes configuration
 */
function parseDishes(dishesPath) {
  const content = fs.readFileSync(dishesPath, 'utf-8');
  const result = {
    dishByPokemon: {},
    dishEffects: {}
  };
  
  // Extract DishByPkm mapping
  const dishByPkmMatch = content.match(/export const DishByPkm[^=]*=\s*{([\s\S]*?)^}/m);
  if (dishByPkmMatch) {
    const dishContent = dishByPkmMatch[1];
    const dishRegex = /\[Pkm\.(\w+)\]:\s*Item\.(\w+)/g;
    let match;
    
    while ((match = dishRegex.exec(dishContent)) !== null) {
      result.dishByPokemon[match[1]] = match[2];
    }
  }
  
  // Extract DishEffects - just document which dishes have effects
  const dishEffectsMatch = content.match(/export const DishEffects[^=]*=\s*{([\s\S]*?)^}/m);
  if (dishEffectsMatch) {
    const effectsContent = dishEffectsMatch[1];
    // Match dish names followed by effect arrays
    const effectRegex = /(\w+):\s*\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]/g;
    let match;
    
    while ((match = effectRegex.exec(effectsContent)) !== null) {
      const dish = match[1];
      const effectsStr = match[2].trim();
      
      // Check if it has effects or is empty array
      if (effectsStr) {
        // Count the effect types
        const onSpawnCount = (effectsStr.match(/new OnSpawnEffect/g) || []).length;
        const onHitCount = (effectsStr.match(/new OnHitEffect/g) || []).length;
        const onConsumedCount = (effectsStr.match(/new OnDishConsumedEffect/g) || []).length;
        const periodicCount = (effectsStr.match(/new PeriodicEffect/g) || []).length;
        
        result.dishEffects[dish] = {
          hasEffects: true,
          effectTypes: {
            onSpawn: onSpawnCount,
            onHit: onHitCount,
            onConsumed: onConsumedCount,
            periodic: periodicCount
          }
        };
      } else {
        result.dishEffects[dish] = {
          hasEffects: false
        };
      }
    }
  }
  
  return result;
}

/**
 * Parse flower pots configuration
 */
function parseFlowerPots(flowerPotsPath) {
  const content = fs.readFileSync(flowerPotsPath, 'utf-8');
  const result = {
    positions: {},
    flowerPots: [],
    flowerMonByPot: {},
    mulchStockCaps: []
  };
  
  // Extract position arrays - need to handle nested arrays
  const bluePositionsMatch = content.match(/export const FLOWER_POTS_POSITIONS_BLUE\s*=\s*\[(\s*\[\s*\d+\s*,\s*\d+\s*\](?:\s*,\s*\[\s*\d+\s*,\s*\d+\s*\])*\s*)\]/);
  if (bluePositionsMatch) {
    const positions = [];
    const posRegex = /\[\s*(\d+)\s*,\s*(\d+)\s*\]/g;
    let match;
    
    while ((match = posRegex.exec(bluePositionsMatch[1])) !== null) {
      positions.push([parseInt(match[1]), parseInt(match[2])]);
    }
    result.positions.blue = positions;
  }
  
  const redPositionsMatch = content.match(/export const FLOWER_POTS_POSITIONS_RED\s*=\s*\[(\s*\[\s*\d+\s*,\s*\d+\s*\](?:\s*,\s*\[\s*\d+\s*,\s*\d+\s*\])*\s*)\]/);
  if (redPositionsMatch) {
    const positions = [];
    const posRegex = /\[\s*(\d+)\s*,\s*(\d+)\s*\]/g;
    let match;
    
    while ((match = posRegex.exec(redPositionsMatch[1])) !== null) {
      positions.push([parseInt(match[1]), parseInt(match[2])]);
    }
    result.positions.red = positions;
  }
  
  // Extract FlowerPots enum values
  const flowersMatch = content.match(/export const FlowerPots\s*=\s*\[([\s\S]*?)\]/);
  if (flowersMatch) {
    const pots = [];
    const potRegex = /FlowerPot\.(\w+)/g;
    let match;
    
    while ((match = potRegex.exec(flowersMatch[1])) !== null) {
      pots.push(match[1]);
    }
    result.flowerPots = pots;
  }
  
  // Extract FlowerMonByPot mapping
  const flowerMonMatch = content.match(/export const FlowerMonByPot[^=]*=\s*{([\s\S]*?)^}/m);
  if (flowerMonMatch) {
    const monContent = flowerMonMatch[1];
    const potRegex = /\[FlowerPot\.(\w+)\]:\s*\[([^\]]+)\]/g;
    let match;
    
    while ((match = potRegex.exec(monContent)) !== null) {
      const pot = match[1];
      const monsStr = match[2];
      const mons = [];
      const monRegex = /Pkm\.(\w+)/g;
      let monMatch;
      
      while ((monMatch = monRegex.exec(monsStr)) !== null) {
        mons.push(monMatch[1]);
      }
      
      result.flowerMonByPot[pot] = mons;
    }
  }
  
  // Extract MulchStockCaps
  const mulchMatch = content.match(/export const MulchStockCaps\s*=\s*\[([\s\S]*?)\]/);
  if (mulchMatch) {
    const caps = mulchMatch[1]
      .split(',')
      .map(line => {
        const num = line.trim().split(/\s+/)[0]; // Get number before comment
        return parseInt(num);
      })
      .filter(n => !isNaN(n));
    result.mulchStockCaps = caps;
  }
  
  return result;
}

/**
 * Parse Item enum and categories
 */
function parseItemEnum(enumPath) {
  const content = fs.readFileSync(enumPath, 'utf-8');
  const result = {
    itemCategories: {},
    itemMappings: {}
  };
  
  // Extract item array constants (e.g., ItemComponentsNoFossilOrScarf, Berries, etc.)
  const arrayRegex = /export const (\w+)(?:\s*:\s*Item\[\])?\s*=\s*\[([\s\S]*?)\](?:\s+satisfies\s+Item\[\])?/g;
  let arrayMatch;
  
  while ((arrayMatch = arrayRegex.exec(content)) !== null) {
    const arrayName = arrayMatch[1];
    const arrayContent = arrayMatch[2];
    
    // Skip if it's a type definition, not an array
    if (arrayContent.includes('=>') || arrayContent.includes('function')) continue;
    
    const items = [];
    const itemRegex = /Item\.(\w+)/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      items.push(itemMatch[1]);
    }
    
    // Also handle spread operators
    const spreadRegex = /\.\.\.(\w+)/g;
    let spreadMatch;
    const spreads = [];
    
    while ((spreadMatch = spreadRegex.exec(arrayContent)) !== null) {
      spreads.push(spreadMatch[1]);
    }
    
    if (items.length > 0 || spreads.length > 0) {
      result.itemCategories[arrayName] = {
        items: items,
        includes: spreads.length > 0 ? spreads : undefined
      };
    }
  }
  
  // Extract ItemRecipe mapping
  const recipeMatch = content.match(/export const ItemRecipe[^=]*=\s*{([\s\S]*?)^}/m);
  if (recipeMatch) {
    const recipeContent = recipeMatch[1];
    const recipes = {};
    const recipeRegex = /\[Item\.(\w+)\]:\s*\[([\s\S]*?)\]/g;
    let match;
    
    while ((match = recipeRegex.exec(recipeContent)) !== null) {
      const item = match[1];
      const ingredientsStr = match[2];
      const ingredients = [];
      const ingredientRegex = /Item\.(\w+)/g;
      let ingredientMatch;
      
      while ((ingredientMatch = ingredientRegex.exec(ingredientsStr)) !== null) {
        ingredients.push(ingredientMatch[1]);
      }
      
      recipes[item] = ingredients;
    }
    
    result.itemMappings.ItemRecipe = recipes;
  }
  
  // Extract SynergyGivenByItem mapping
  const synergyItemMatch = content.match(/export const SynergyGivenByItem\s*=\s*{([\s\S]*?)^}/m);
  if (synergyItemMatch) {
    const synergyContent = synergyItemMatch[1];
    const synergies = {};
    const synergyRegex = /\[Item\.(\w+)\]:\s*Synergy\.(\w+)/g;
    let match;
    
    while ((match = synergyRegex.exec(synergyContent)) !== null) {
      synergies[match[1]] = match[2];
    }
    
    result.itemMappings.SynergyGivenByItem = synergies;
  }
  
  // Extract SynergyGivenByGem mapping
  const synergyGemMatch = content.match(/export const SynergyGivenByGem[^=]*=\s*{([\s\S]*?)^}/m);
  if (synergyGemMatch) {
    const gemContent = synergyGemMatch[1];
    const gems = {};
    const gemRegex = /\[Item\.(\w+)\]:\s*Synergy\.(\w+)/g;
    let match;
    
    while ((match = gemRegex.exec(gemContent)) !== null) {
      gems[match[1]] = match[2];
    }
    
    result.itemMappings.SynergyGivenByGem = gems;
  }
  
  // Extract SynergyFlavors mapping
  const synergyFlavorsMatch = content.match(/export const SynergyFlavors\s*=\s*{([\s\S]*?)^}/m);
  if (synergyFlavorsMatch) {
    const flavorsContent = synergyFlavorsMatch[1];
    const flavors = {};
    const flavorRegex = /\[Synergy\.(\w+)\]:\s*Item\.(\w+)/g;
    let match;
    
    while ((match = flavorRegex.exec(flavorsContent)) !== null) {
      flavors[match[1]] = match[2];
    }
    
    result.itemMappings.SynergyFlavors = flavors;
  }
  
  // Extract WeatherRocksByWeather mapping
  const weatherRocksMatch = content.match(/export const WeatherRocksByWeather\s*=\s*new Map\(\[([\s\S]*?)\]\)/);
  if (weatherRocksMatch) {
    const weatherContent = weatherRocksMatch[1];
    const weathers = {};
    const weatherRegex = /\[Weather\.(\w+),\s*(?:Item\.(\w+)|null)\]/g;
    let match;
    
    while ((match = weatherRegex.exec(weatherContent)) !== null) {
      weathers[match[1]] = match[2] || null;
    }
    
    result.itemMappings.WeatherRocksByWeather = weathers;
  }
  
  // Extract AbilityPerTM mapping
  const abilityTMMatch = content.match(/export const AbilityPerTM[^=]*=\s*{([\s\S]*?)^}/m);
  if (abilityTMMatch) {
    const tmContent = abilityTMMatch[1];
    const abilities = {};
    const abilityRegex = /\[Item\.(\w+)\]:\s*Ability\.(\w+)/g;
    let match;
    
    while ((match = abilityRegex.exec(tmContent)) !== null) {
      abilities[match[1]] = match[2];
    }
    
    result.itemMappings.AbilityPerTM = abilities;
  }
  
  // Extract MemoryDiscsBySynergy mapping
  const memoryDiscsMatch = content.match(/export const MemoryDiscsBySynergy[^=]*=\s*{([\s\S]*?)^}/m);
  if (memoryDiscsMatch) {
    const memoryContent = memoryDiscsMatch[1];
    const memories = {};
    const memoryRegex = /\[Synergy\.(\w+)\]:\s*Item\.(\w+)/g;
    let match;
    
    while ((match = memoryRegex.exec(memoryContent)) !== null) {
      memories[match[1]] = match[2];
    }
    
    result.itemMappings.MemoryDiscsBySynergy = memories;
  }
  
  return result;
}

/**
 * Parse PVE stages
 */
function parsePVEStages(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract the PVEStages object
  const stagesMatch = content.match(/export const PVEStages[^=]*=\s*{([\s\S]*?)^}/m);
  if (!stagesMatch) return {};
  
  const stagesContent = stagesMatch[1];
  const stages = {};
  
  // Match each stage block
  const stageRegex = /(\d+):\s*{([\s\S]*?)^  }/gm;
  let match;
  
  while ((match = stageRegex.exec(stagesContent)) !== null) {
    const stageNum = parseInt(match[1]);
    const stageContent = match[2];
    const stage = {};
    
    // Extract name
    const nameMatch = stageContent.match(/name:\s*"([^"]+)"/);
    if (nameMatch) stage.name = nameMatch[1];
    
    // Extract avatar
    const avatarMatch = stageContent.match(/avatar:\s*Pkm\.(\w+)/);
    if (avatarMatch) stage.avatar = avatarMatch[1];
    
    // Extract emotion
    const emotionMatch = stageContent.match(/emotion:\s*Emotion\.(\w+)/);
    if (emotionMatch) stage.emotion = emotionMatch[1];
    
    // Extract shiny chance
    const shinyMatch = stageContent.match(/shinyChance:\s*([\d\/\s\.]+)/);
    if (shinyMatch) {
      const valueStr = shinyMatch[1].trim();
      let value;
      if (valueStr.includes('/')) {
        const [num, denom] = valueStr.split('/').map(s => parseFloat(s.trim()));
        value = num / denom;
      } else {
        value = parseFloat(valueStr);
      }
      stage.shinyChance = {
        value: value,
        percentage: (value * 100).toFixed(2) + '%'
      };
    }
    
    // Extract board composition - need to handle multiline nested arrays
    const boardMatch = stageContent.match(/board:\s*\[(\s*\[[^\]]+\](?:\s*,\s*\[[^\]]+\])*\s*)\]/);
    if (boardMatch) {
      const boardContent = boardMatch[1];
      const board = [];
      const pokemonRegex = /\[Pkm\.(\w+),\s*(\d+),\s*(\d+)\]/g;
      let pkmnMatch;
      
      while ((pkmnMatch = pokemonRegex.exec(boardContent)) !== null) {
        board.push({
          pokemon: pkmnMatch[1],
          x: parseInt(pkmnMatch[2]),
          y: parseInt(pkmnMatch[3])
        });
      }
      if (board.length > 0) {
        stage.board = board;
      }
    }
    
    // Extract marowak items - need to handle nested arrays more carefully
    const marowakMatch = stageContent.match(/marowakItems:\s*\[(\s*\[[^\]]*\](?:\s*,\s*\[[^\]]*\])*\s*)\]/);
    if (marowakMatch) {
      const marowakContent = marowakMatch[1];
      const items = [];
      // Match each inner array
      const innerArrayRegex = /\[([^\]]*)\]/g;
      let arrayMatch;
      
      while ((arrayMatch = innerArrayRegex.exec(marowakContent)) !== null) {
        const itemsStr = arrayMatch[1].trim();
        if (itemsStr) {
          const pokemonItems = [];
          const itemRegex = /Item\.(\w+)/g;
          let singleItemMatch;
          
          while ((singleItemMatch = itemRegex.exec(itemsStr)) !== null) {
            pokemonItems.push(singleItemMatch[1]);
          }
          items.push(pokemonItems);
        } else {
          items.push([]);
        }
      }
      if (items.length > 0) {
        stage.marowakItems = items;
      }
    }
    
    // Extract stat boosts
    const statBoostsMatch = stageContent.match(/statBoosts:\s*{([\s\S]*?)}/);
    if (statBoostsMatch) {
      const boostsContent = statBoostsMatch[1];
      const boosts = {};
      const boostRegex = /\[Stat\.(\w+)\]:\s*(-?\d+)/g;
      let boostMatch;
      
      while ((boostMatch = boostRegex.exec(boostsContent)) !== null) {
        boosts[boostMatch[1]] = parseInt(boostMatch[2]);
      }
      stage.statBoosts = boosts;
    }
    
    // Extract static rewards array
    const rewardsMatch = stageContent.match(/rewards:\s*(\w+)/);
    if (rewardsMatch) {
      stage.rewardsType = rewardsMatch[1];
    }
    
    // Detect getRewards function
    if (stageContent.includes('getRewards(')) {
      stage.hasGetRewards = true;
    }
    
    // Detect getRewardsPropositions function
    if (stageContent.includes('getRewardsPropositions(')) {
      stage.hasGetRewardsPropositions = true;
    }
    
    stages[stageNum] = stage;
  }
  
  return stages;
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
  
  // Process dishes
  const dishesPath = path.join(PAC_ROOT, 'app/core/dishes.ts');
  if (fs.existsSync(dishesPath)) {
    configs.dishes = parseDishes(dishesPath);
    console.log('✓ Processed dishes');
  }
  
  // Process flower pots
  const flowerPotsPath = path.join(PAC_ROOT, 'app/core/flower-pots.ts');
  if (fs.existsSync(flowerPotsPath)) {
    configs.flowerPots = parseFlowerPots(flowerPotsPath);
    console.log('✓ Processed flower pots');
  }
  
  // Process Item enum
  const itemEnumPath = path.join(PAC_ROOT, 'app/types/enum/Item.ts');
  if (fs.existsSync(itemEnumPath)) {
    configs.itemEnum = parseItemEnum(itemEnumPath);
    console.log('✓ Processed Item enum');
  }
  
  // Process PVE stages
  const pveStagesPath = path.join(PAC_ROOT, 'app/models/pve-stages.ts');
  if (fs.existsSync(pveStagesPath)) {
    configs.pveStages = parsePVEStages(pveStagesPath);
    console.log('✓ Processed PVE stages');
  }
  
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