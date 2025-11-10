---
title: Add Pick Signs
layout: default
parent: Misc
nav_order: 1
---

# Add Pick Signs

<div id="pokemon-selector">
  <h3>Select Added Pokemon:</h3>
  <h4 style="margin-top: 15px; margin-bottom: 8px; color: #666;">Uncommon</h4>
  <div id="uncommon-buttons" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;"></div>
  <h4 style="margin-top: 15px; margin-bottom: 8px; color: #666;">Rare</h4>
  <div id="rare-buttons" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;"></div>
  <button id="clear-all-btn" style="margin-bottom: 20px; padding: 5px 15px;">Clear All</button>
</div>

<div id="content-sections"></div>

<style>
  .pokemon-btn {
    padding: 8px 12px;
    border: 2px solid #ccc;
    background-color: #f0f0f0;
    color: #333;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .pokemon-btn:hover {
    background-color: #e0e0e0;
  }
  
  .pokemon-btn.selected {
    background-color: #4CAF50;
    color: white;
    border-color: #45a049;
  }
  
  .content-section {
    display: none;
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fafafa;
    color: #333;
  }
  
  .content-section.visible {
    display: block;
  }
  
  .content-section.conditional-section {
    background-color: #e3f2fd;
    border: 2px solid #2196F3;
  }
  
  .section-title {
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
  }
  
  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    h4 {
      color: #aaa !important;
    }
    
    .pokemon-btn {
      background-color: #3a3a3a;
      border-color: #555;
      color: #e0e0e0;
    }
    
    .pokemon-btn:hover {
      background-color: #4a4a4a;
    }
    
    .pokemon-btn.selected {
      background-color: #4CAF50;
      color: white;
      border-color: #45a049;
    }
    
    .content-section {
      background-color: #2a2a2a;
      border-color: #555;
      color: #e0e0e0;
    }
    
    .content-section.conditional-section {
      background-color: #1e3a5f;
      border-color: #3d7ac4;
    }
    
    .section-title {
      color: #e0e0e0;
    }
    
    #clear-all-btn {
      background-color: #3a3a3a;
      border: 2px solid #555;
      color: #e0e0e0;
    }
    
    #clear-all-btn:hover {
      background-color: #4a4a4a;
    }
  }
</style>

<script type="text/javascript">
(function() {
  var pokemonData = {
    "Growlithe": "Fire/Field",
    "Psyduck": "Water/Psychic",
    "Slowpoke": "Water/Psychic",
    "Shelder": "Rock/Ice",
    "Chinchou": "Electric/Light",
    "Voltorb": "Electric/Artificial",
    "Ladyba": "Vertical Fighting",
    "Venonat": "Bug/Poison",
    "Smoochum": "Human Psychic, Baby 7",
    "Mime Jr": "Human Psychic, Baby 7",
    "Pineco": "Vertical Steel, Bug/Steel",
    "Skrelp": "Dragon/Water, Dragon Aquatic",
    "Tentacool": "Poison Aquatic",
    "Skitty": "Fairy/Normal",
    "Minccino": "Sound/Normal",
    "Greavard": "Field, Ghost with Spiritomb",
    "Petilil": "Grass/Flora, Grass/Fighting",
    "Sandyghast": "Ghost/Amorph/Artificial",
    "Sinistea": "Ghost/Amorph/Artificial",
    "Capsakid": "Gourmet, Alcremie Combo",
    "Seel": "Ice/Aquatic",
    "Anorith": "Fossil/Rock/Bug",
    "Archen": "Fossil/Rock/Bug",
    "Koffing": "Poison/Amorph",
    "Grimer": "Poison/Amorph",
    "Omanyte": "Water/Bug/Amorph",
    "Dewpider": "Water/Bug/Amorph",
    "Clobbopus": "Aquatic/Amorph",
    "Paras": "Bug/Poison",
    "Sunkern": "Flora/Light",
    "Formantis": "Flora/Light",
    "Shroomish": "Grass/Fighting with Lilligant",
    "Vulpix": "Psychic",
    "Natu": "Psychic",
    "Staryu": "Water/Psychic",
    "Clauncher": "Water/Sound",
    "Electrike": "Field/Electric",
    "Munna": "Field/Psychic",
    "Meowth": "Field Normal",
    "Sentrent": "Field Normal",
    "Nickit": "3+ Field adds - Vertical Field",
    "Fidough": "3+ Field adds - Vertical Field",
    "Nymble": "Kleavor/Skorupi",
    "Elgyem": "Psychic/Light",
    "Croagunk": "Poison/Aquatic",
    "Wooper": "Poison/Aquatic",
    "Tyrunt": "Dragon, Fossil/Rock",
    "Chewtle": "Rock/Monster",
    "Yanma": "Fossil/Bug",
    "Surskit": "Bug/Aquatic",
    "Driftloon": "Ghost/Amorph/Artificial",
    "Golett": "Ghost/Amorph/Artificial",
    "Swirlx": "Fairy/Gourmet"
  };
  
  var conditionalSections = [
    {
      id: "psyduck-slowpoke-water-psychic",
      requires: ["Psyduck", "Slowpoke"],
      title: "Psyduck + Slowpoke",
      content: "Water/Psychic synergy"
    },
    {
      id: "ladyba-venonat-bug-flying",
      requires: ["Ladyba", "Venonat"],
      title: "Ladyba + Venonat",
      content: "Bug/Flying synergy"
    },
    {
      id: "skrelp-tentacool-poison-aquatic",
      requires: ["Skrelp", "Tentacool"],
      title: "Skrelp + Tentacool",
      content: "Poison Aquatic synergy"
    },
    {
      id: "skitty-minccino-field-normal",
      requires: ["Skitty", "Minccino"],
      title: "Skitty + Minccino",
      content: "Field/Normal synergy"
    },
    {
      id: "sandyghast-sinistea-ghost-amorph",
      requires: ["Sandyghast", "Sinistea"],
      title: "Sandyghast + Sinistea",
      content: "Ghost/Amorph/Artificial synergy"
    },
    {
      id: "sinistea-capsakid-gourmet",
      requires: ["Sinistea", "Capsakid"],
      title: "Sinistea + Capsakid",
      content: "Gourmet, Alcremie Combo"
    },
    {
      id: "anorith-archen-fossil",
      requires: ["Anorith", "Archen"],
      title: "Anorith + Archen",
      content: "Fossil/Rock/Bug synergy"
    },
    {
      id: "koffing-grimer-poison-amorph",
      requires: ["Koffing", "Grimer"],
      title: "Koffing + Grimer",
      content: "Poison/Amorph synergy"
    },
    {
      id: "omanyte-dewpider-water-amorph",
      requires: ["Omanyte", "Dewpider"],
      title: "Omanyte + Dewpider",
      content: "Water/Bug/Amorph synergy"
    },
    {
      id: "paras-venonat-bug-poison",
      requires: ["Paras", "Venonat"],
      title: "Paras + Venonat",
      content: "Bug/Poison synergy"
    },
    {
      id: "sunkern-formantis-flora-light",
      requires: ["Sunkern", "Formantis"],
      title: "Sunkern + Formantis",
      content: "Flora/Light synergy"
    },
    {
      id: "vulpix-natu-psychic",
      requires: ["Vulpix", "Natu"],
      title: "Vulpix + Natu",
      content: "Psychic synergy"
    },
    {
      id: "staryu-psyduck-slowpoke-water-psychic",
      requires: ["Staryu", "Psyduck", "Slowpoke"],
      title: "Staryu + Psyduck + Slowpoke",
      content: "Water/Psychic synergy - strong combination"
    },
    {
      id: "meowth-sentrent-field-normal",
      requires: ["Meowth", "Sentrent"],
      title: "Meowth + Sentrent",
      content: "Field Normal synergy"
    },
    {
      id: "croagunk-wooper-poison-aquatic",
      requires: ["Croagunk", "Wooper"],
      title: "Croagunk + Wooper",
      content: "Poison/Aquatic synergy"
    },
    {
      id: "tyrunt-archen-fossil-rock",
      requires: ["Tyrunt", "Archen"],
      title: "Tyrunt + Archen",
      content: "Dragon, Fossil/Rock synergy"
    },
    {
      id: "yanma-anorith-fossil-bug",
      requires: ["Yanma", "Anorith"],
      title: "Yanma + Anorith",
      content: "Fossil/Bug synergy"
    },
    {
      id: "surskit-anorith-bug-aquatic",
      requires: ["Surskit", "Anorith"],
      title: "Surskit + Anorith",
      content: "Bug/Aquatic synergy"
    },
    {
      id: "driftloon-golett-ghost-amorph",
      requires: ["Driftloon", "Golett"],
      title: "Driftloon + Golett",
      content: "Ghost/Amorph/Artificial synergy"
    },
    {
      id: "fidough-swirlx-fairy-gourmet",
      requires: ["Fidough", "Swirlx"],
      title: "Fidough + Swirlx",
      content: "Fairy/Gourmet synergy"
    }
  ];
  
  var selectedPokemon = new Set();
  
  var uncommonPokemon = [
    "Growlithe", "Psyduck", "Slowpoke", "Shelder", "Chinchou", "Voltorb",
    "Ladyba", "Venonat", "Smoochum", "Mime Jr", "Pineco", "Skrelp",
    "Tentacool", "Skitty", "Minccino", "Greavard", "Petilil", "Sandyghast",
    "Sinistea", "Capsakid", "Seel", "Anorith", "Archen", "Koffing",
    "Grimer", "Omanyte", "Dewpider", "Clobbopus", "Paras", "Sunkern",
    "Formantis", "Shroomish"
  ];
  
  var rarePokemon = [
    "Vulpix", "Natu", "Staryu", "Clauncher", "Electrike", "Munna",
    "Meowth", "Sentrent", "Nickit", "Fidough", "Nymble", "Elgyem",
    "Croagunk", "Wooper", "Tyrunt", "Chewtle", "Yanma", "Surskit",
    "Driftloon", "Golett", "Swirlx"
  ];
  
  function init() {
    var uncommonContainer = document.getElementById('uncommon-buttons');
    var rareContainer = document.getElementById('rare-buttons');
    var contentContainer = document.getElementById('content-sections');
    
    Object.keys(pokemonData).forEach(function(pokemon) {
      var btn = document.createElement('button');
      btn.className = 'pokemon-btn';
      btn.textContent = pokemon;
      btn.id = 'btn-' + pokemon;
      btn.addEventListener('click', function() { togglePokemon(pokemon); });
      
      if (uncommonPokemon.indexOf(pokemon) !== -1) {
        uncommonContainer.appendChild(btn);
      } else if (rarePokemon.indexOf(pokemon) !== -1) {
        rareContainer.appendChild(btn);
      }
      
      var section = document.createElement('div');
      section.className = 'content-section';
      section.id = 'section-' + pokemon;
      section.innerHTML = '<div class="section-title">' + pokemon + '</div><div>' + pokemonData[pokemon] + '</div>';
      contentContainer.appendChild(section);
    });
    
    conditionalSections.forEach(function(condSection) {
      var section = document.createElement('div');
      section.className = 'content-section conditional-section';
      section.id = 'section-' + condSection.id;
      section.innerHTML = '<div class="section-title" style="color: #0066cc;">✨ ' + condSection.title + '</div><div>' + condSection.content + '</div>';
      contentContainer.appendChild(section);
    });
    
    document.getElementById('clear-all-btn').addEventListener('click', clearAll);
  }
  
  function checkConditionalSections() {
    conditionalSections.forEach(function(condSection) {
      var section = document.getElementById('section-' + condSection.id);
      var allSelected = condSection.requires.every(function(pokemon) {
        return selectedPokemon.has(pokemon);
      });
      
      if (allSelected) {
        section.classList.add('visible');
      } else {
        section.classList.remove('visible');
      }
    });
  }
  
  function togglePokemon(pokemon) {
    var btn = document.getElementById('btn-' + pokemon);
    var section = document.getElementById('section-' + pokemon);
    
    if (selectedPokemon.has(pokemon)) {
      selectedPokemon.delete(pokemon);
      btn.classList.remove('selected');
      section.classList.remove('visible');
    } else {
      selectedPokemon.add(pokemon);
      btn.classList.add('selected');
      section.classList.add('visible');
    }
    
    checkConditionalSections();
  }
  
  function clearAll() {
    selectedPokemon.clear();
    document.querySelectorAll('.pokemon-btn').forEach(function(btn) {
      btn.classList.remove('selected');
    });
    document.querySelectorAll('.content-section').forEach(function(section) {
      section.classList.remove('visible');
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>