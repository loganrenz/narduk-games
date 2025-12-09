# Narduk Games

A monorepo containing all games by Narduk.

## 🎮 Games

### Live Games
- **[Lexi-Stack](./games/lexi-stack)** - A word-stacking puzzle game

### In Development
- **[Wordle Clone](./games/wordle-clone)** - A Wordle-inspired word guessing game (coming soon)

## 🏗️ Monorepo Structure

```
narduk-games/
├── games/
│   ├── lexi-stack/         # Lexi-Stack game
│   ├── wordle-clone/       # Wordle clone game
│   └── [future-game]/      # Add new games here
├── shared/                 # Shared utilities and components
├── package.json            # Root package.json with workspace scripts
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Cloudflare account (for D1 database)
- Vercel account (for deployment)

### Installation

Install dependencies for all games:
```bash
npm run install:all
```

Or install dependencies for a specific game:
```bash
npm run install:lexi-stack
npm run install:wordle-clone
```

## 🛠️ Development

### Run a specific game locally
```bash
npm run lexi-stack:dev
npm run wordle-clone:dev
```

### Build a specific game
```bash
npm run lexi-stack:build
npm run wordle-clone:build
```

### Build all games
```bash
npm run build:all
```

### Run tests
```bash
npm run lexi-stack:test
npm run wordle-clone:test
npm run test:all
```

## 📦 Deployment

This monorepo is designed to work with:
- **Vercel**: For hosting the frontend games
- **Cloudflare**: For DNS and D1 database services

### Deployment Strategy

Each component is deployed separately:
- **Landing Page** (`narduk.games`): Deployed from root directory
- **Lexi-Stack** (`lexi-stack.narduk.games`): Deployed from `games/lexi-stack`
- **Wordle Clone** (coming soon): Deployed from `games/wordle-clone`

### Quick Deploy

Deploy a specific game:
```bash
cd games/lexi-stack
vercel --prod
```

Deploy the landing page:
```bash
# From root directory
vercel --prod
```

### Cloudflare Workers & D1

For games using Cloudflare Workers and D1:
```bash
cd games/lexi-stack
npm run deploy:worker  # Deploy worker
npm run db:migrate      # Apply database migrations
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## ➕ Adding a New Game

To add a new game to the monorepo:

1. **Create a new directory** in the `games/` folder:
   ```bash
   mkdir games/your-game-name
   cd games/your-game-name
   ```

2. **Initialize the game** with your preferred framework:
   ```bash
   npm create vite@latest . -- --template vue
   # or use any other framework/template
   ```

3. **Add game-specific configuration**:
   - Create a `vercel.json` for Vercel deployment settings
   - Create a `wrangler.toml` if using Cloudflare Workers/D1
   - Add a README.md with game-specific documentation

4. **Update root package.json** to add convenience scripts:
   ```json
   {
     "scripts": {
       "your-game:dev": "cd games/your-game-name && npm run dev",
       "your-game:build": "cd games/your-game-name && npm run build",
       "your-game:test": "cd games/your-game-name && npm run test"
     }
   }
   ```

5. **Update the main README** to list the new game in the Games section.

## 🔧 Technology Stack

- **Frontend**: Vue.js, Vite
- **Styling**: CSS
- **Testing**: Vitest
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Vercel
- **DNS/Services**: Cloudflare

## 📝 License

MIT

## 👤 Author

**loganrenz**
- GitHub: [@loganrenz](https://github.com/loganrenz)
