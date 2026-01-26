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
