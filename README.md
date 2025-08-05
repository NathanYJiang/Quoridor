# Quoridor

A browser-based implementation of the classic Quoridor board game with an AI bot component.

## Project Structure

- `game/` - Browser-based Quoridor game (TypeScript/HTML/CSS)
- `bot/` - Python AI bot for playing Quoridor

## Game Component

The game is a simple browser-based implementation using TypeScript, HTML, and CSS.

### Setup

```bash
cd game
npm install
npm run build
npm start
```

### Features

- 9x9 grid board
- Two players with 10 walls each
- Click-based movement and wall placement
- Wall validation (no blocking paths)
- Win condition detection

## Bot Component

The Python bot provides AI functionality for playing Quoridor.

### Setup

```bash
cd bot
pip install -r requirements.txt
```

### Usage

```bash
python main.py
```

## Game Rules

1. Players start at opposite ends of the board
2. On each turn, a player can either:
   - Move their piece orthogonally to an adjacent square
   - Place a wall to block opponent movement
3. Players cannot place walls that completely block either player's path to their goal
4. First player to reach the opposite side wins

## Development

The game logic is decoupled from the UI, making it easy to integrate with the Python bot for AI gameplay.
