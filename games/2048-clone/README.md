# 2048 Clone

A classic 2048 puzzle game implementation. Join tiles with the same numbers to reach 2048!

## Features

- Classic 2048 gameplay
- Arrow key controls
- Touch/swipe controls for mobile
- Score tracking with best score persistence
- Game statistics
- Smooth animations
- Responsive design

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel

The game is configured for Vercel deployment. Build and deploy:

```bash
npm run build
vercel --prod
```

### Cloudflare Workers

The game includes a Cloudflare Worker for API functionality (scores, leaderboard, stats).

1. **Create the D1 database:**
```bash
wrangler d1 create 2048-clone-data
```

2. **Update `wrangler.toml`** with the database ID from step 1.

3. **Apply migrations:**
```bash
npm run db:migrate
```

4. **Deploy the worker:**
```bash
npm run deploy:worker
```

## Game Controls

- **Arrow Keys**: Move tiles in the corresponding direction
- **Swipe**: On mobile, swipe in any direction to move tiles
- **New Game**: Click the "New Game" button to start a fresh game

## How to Play

1. Use arrow keys or swipe to move all tiles in one direction
2. When two tiles with the same number touch, they merge into one
3. After each move, a new tile (2 or 4) appears randomly
4. Try to create a tile with the number 2048 to win!
5. The game ends when the board is full and no moves are possible

## Game State

The game automatically saves your progress to local storage, so you can continue where you left off.

