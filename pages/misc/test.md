---
title: Test
layout: home
parent: Misc
nav_order: 100
---

# Test Page

![Fire Type]({{ site.baseurl }}/assets/images/types/FIRE.png)
![Rare Candy]({{ site.baseurl }}/assets/images/items/RARE_CANDY.png)


Charizard (using simplified path):

![Charizard]({{ site.baseurl }}/assets/images/portraits/CHARIZARD.png)

Or reference by data:
- Charizard index: {{ site.data.pokemon.CHARIZARD }}

Simple usage:
{% include pokemon.html name="charizard" %}

With custom size:
{% include pokemon.html name="pikachu" size="64" %}

Multiple pokemon:
{% include pokemon.html name="bulbasaur" %}
{% include pokemon.html name="squirtle" %}
{% include pokemon.html name="charmander" %}

Case insensitive:
{% include pokemon.html name="MEWTWO" %}
{% include pokemon.html name="Gyarados" %}

Debug test:
- Pokemon data exists: {{ site.data.pokemon.CHARIZARD }}
- Baseurl: {{ site.baseurl }}

Direct include test:
{% include pokemon.html name="charizard" %}


# Pokemon Display Tests

## Simple Portrait
{% include pokemon.html name="charizard" %}
{% include pokemon.html name="pikachu" size="64" %}

## Pokemon Card
{% include pokemon_card.html name="charizard" %}
{% include pokemon_card.html name="pikachu" %}
{% include pokemon_card.html name="mewtwo" %}
{% include pokemon_card.html name="slowpoke" %}
{% include pokemon_card.html name="galarian_slowpoke" %}
{% include pokemon_card.html name="blissey" %}
{% include pokemon_card.html name="melmetal" %}
{% include pokemon_card.html name="froakie" %}


# Fire Type Pokemon

{% assign fire_pokemon = site.data.pokemon_by_type.FIRE %}
{% include pokemon_table.html pokemon=fire_pokemon id="fire-table" %}