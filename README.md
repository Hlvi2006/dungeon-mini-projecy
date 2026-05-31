# Dungeon Escape

## Overview

Dungeon Escape is a 2D action-adventure game where a brave warrior finds himself trapped inside a dangerous dungeon filled with enemies, treasure, and hidden challenges.

Your mission is simple: survive, defeat every enemy, collect valuable rewards, and find the exit before your health reaches zero.

## Game Design

Paste your Excalidraw drawing below:

![Game Design](.\assets\dungeon-sketch.png)

## Gameplay

The player controls a warrior using the keyboard:

- W → Move Up
- A → Move Left
- S → Move Down
- D → Move Right
- Space → Attack with Sword

The dungeon contains hostile enemies that guard the path to freedom. The warrior must approach enemies and attack them with his sword. Every successful hit reduces the enemy's health.

Enemies are dangerous. If they get close enough to the player, they strike back and reduce the warrior's HP. The player must carefully manage health while clearing the dungeon.

Throughout the dungeon, treasure chests can be discovered. Opening a chest rewards the player with gold and valuable loot.

The exit door remains locked while enemies are still alive. Only after defeating every enemy can the warrior unlock the door and escape.

## Objectives

1. Explore the dungeon.
2. Defeat all enemies.
3. Open treasure chests and collect rewards.
4. Reach the exit door.
5. Escape the dungeon and win the game.

## How to Play

### Controls

- W → Move Up
- A → Move Left
- S → Move Down
- D → Move Right
- Space → Attack

### Objective

Defeat all enemies, unlock the exit door, and escape the dungeon.

### Win Condition

The player wins by defeating all enemies and entering the exit door.

### Lose Condition

The game ends when the player's HP reaches zero.

## Game Entities

### Warrior

The main character controlled by the player.

- HP: 100
- Attack Damage: 10
- Controlled with WASD
- Attacks with Space

### Enemy

Hostile creatures that protect the dungeon.

- HP: 30
- Attack Damage: 5
- Damage the player when nearby

### Treasure Chest

Contains rewards and gold.

### Exit Door

Locked until all enemies are defeated.

### Walls

Block movement and create the dungeon layout.

## Tech Decisions

This project was built using Object-Oriented Programming (OOP).

### Why OOP?

- Each game entity has its own behavior and state.
- Code is easier to organize and maintain.
- New features can be added more easily.
- Classes help keep game logic reusable and scalable.

Main entities represented as classes include:

- Player
- Enemy
- Chest
- Door

## Play Online

GitHub Pages:

https://hlvi2006.github.io/dungeon-mini-projecy/

## AI Diary

Development notes can be found here:

[AI_DIARY.md](./AI_DIARY.md)

## Known Bugs / What I'd Fix Next

### Known Bugs

- Enemy movement can occasionally feel inconsistent.
- Combat balance may require further tuning.
- Collision handling could be improved in some situations.

### Future Improvements

- Multiple dungeon levels
- Different enemy types
- Boss battles
- Inventory system
- Weapons and upgrades
- Sound effects
- Better animations
- Save system
- More treasure and collectibles

## Credits

Developed as part of the Ironhack Web Development Bootcamp project.