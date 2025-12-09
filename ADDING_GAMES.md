# Adding New Games to Narduk Games Monorepo

This guide will walk you through the process of adding a new game to the Narduk Games monorepo.

## Quick Start

### 1. Create Game Directory

```bash
mkdir games/your-game-name
cd games/your-game-name
```

### 2. Initialize Your Game

You can use any framework or build tool. Here are some common options:

**Vue.js (recommended for consistency):**
```bash
npm create vite@latest . -- --template vue
npm install
```

**React:**
```bash
npm create vite@latest . -- --template react
npm install
```

**Vanilla JavaScript:**
```bash
npm create vite@latest . -- --template vanilla
npm install
```

### 3. Configure Vercel Deployment

Create `vercel.json` in your game directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 4. (Optional) Configure Cloudflare D1

If your game needs a database, create `wrangler.toml`:

```toml
name = "your-game-name"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "your-game-db"
database_id = "your-database-id"
```

And create migrations in `migrations/` directory.

### 5. Update Root package.json

Add convenience scripts to the root `package.json`:

```json
{
  "scripts": {
    "your-game:dev": "cd games/your-game-name && npm run dev",
    "your-game:build": "cd games/your-game-name && npm run build",
    "your-game:test": "cd games/your-game-name && npm run test",
    "install:your-game": "cd games/your-game-name && npm install"
  }
}
```

### 6. Update Main README

Add your game to the Games section in the root `README.md`:

```markdown
## 🎮 Games

### Live Games
- **[Lexi-Stack](./games/lexi-stack)** - A word-stacking puzzle game
- **[Your Game Name](./games/your-game-name)** - Brief description

### In Development
- **[Wordle Clone](./games/wordle-clone)** - A Wordle-inspired word guessing game
```

### 7. Update Landing Page

Edit `index.html` to add a card for your game:

```html
<a href="./games/your-game-name/index.html" class="game-card">
    <div class="game-icon">🎯</div>
    <h2>Your Game Name</h2>
    <p>Brief description of your game</p>
    <span class="game-status status-live">🎮 Play Now</span>
</a>
```

## Best Practices

### Directory Structure

Keep your game self-contained:

```
games/your-game-name/
├── src/                 # Source code
├── public/              # Static assets
├── tests/               # Test files
├── package.json         # Dependencies
├── vercel.json          # Vercel config
├── wrangler.toml        # Cloudflare config (if needed)
├── vite.config.js       # Build config
├── README.md            # Game documentation
└── .gitignore           # Git ignore rules
```

### Package.json Scripts

Ensure your `package.json` has these standard scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### Shared Utilities

If you have code that could be shared across games, place it in the `shared/` directory:

```
shared/
├── utils/               # Shared utilities
├── components/          # Shared components
└── styles/              # Shared styles
```

Then import from other games:

```javascript
import { someUtil } from '../../../shared/utils/someUtil.js'
```

## Deployment

### Vercel

Each game can be deployed individually:

```bash
cd games/your-game-name
vercel --prod
```

Or deploy from the monorepo root (configure in root `vercel.json`).

### Cloudflare Workers

For games using Cloudflare Workers:

```bash
cd games/your-game-name
npm run deploy:worker
```

### Database Migrations

For games using Cloudflare D1:

```bash
cd games/your-game-name
wrangler d1 migrations apply your-db-id --remote
```

## Testing

### Local Testing

```bash
npm run your-game:dev
```

### Run Tests

```bash
npm run your-game:test
```

### Build Verification

```bash
npm run your-game:build
```

## Example: Creating a Simple Game

Here's a complete example of adding a simple Tic-Tac-Toe game:

```bash
# 1. Create directory
mkdir games/tic-tac-toe
cd games/tic-tac-toe

# 2. Initialize with Vite
npm create vite@latest . -- --template vue
npm install

# 3. Create vercel.json
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
EOF

# 4. Update root package.json (manually add scripts)

# 5. Update root README.md (manually add game entry)

# 6. Update index.html (manually add game card)

# 7. Develop your game!
npm run dev
```

## Troubleshooting

### Build Issues

- Ensure all dependencies are installed: `npm install`
- Check that your build command works: `npm run build`
- Verify the output directory matches your config

### Deployment Issues

- Ensure `vercel.json` has correct paths
- Check that environment variables are set in Vercel dashboard
- For D1 databases, ensure migrations are applied

### Import Issues

- Use relative paths for local imports
- For shared utilities, use paths from the root
- Ensure file extensions are included for ES modules

## Need Help?

- Check existing games in `games/` for examples
- Review the root `README.md` for overall structure
- Open an issue on GitHub if you encounter problems

Happy game building! 🎮
