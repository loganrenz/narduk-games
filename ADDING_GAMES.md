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

### 4. Configure Cloudflare Workers (REQUIRED)

**All games MUST use Cloudflare Workers for backend API functionality.**

Create `wrangler.toml` in your game directory:

```toml
name = "your-game-api"
main = "src/worker.js"
compatibility_date = "2024-01-01"

# Game data database (scores, stats, etc.)
[[d1_databases]]
binding = "DB"
database_name = "your-game-data"
# database_id will be set after creating the database with: wrangler d1 create your-game-data

# Auth API URL for user validation
vars = { AUTH_API_URL = "https://narduk-games-auth-api.narduk.workers.dev" }

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "your-game-data"
# database_id will be set after creating the database

[env.production.vars]
AUTH_API_URL = "https://narduk-games-auth-api.narduk.workers.dev"
```

Create `src/worker.js` for your game API:

```javascript
// Your Game Data API
// Handles game-specific data (scores, stats, etc.)
// User authentication is handled by the unified auth API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Add your API routes here
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/scores' && method === 'GET') {
        return handleGetLeaderboard(request, env.DB, corsHeaders);
      }
      // Add more routes as needed

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// Implement your API handlers here
async function handleSubmitScore(request, db, authApiUrl, corsHeaders) {
  // Your implementation
}

async function handleGetLeaderboard(request, db, corsHeaders) {
  // Your implementation
}
```

Create database migrations in `migrations/` directory:

```sql
-- 0001_initial_schema.sql
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Add more tables as needed
```

Add wrangler to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy:worker": "wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply YOUR_DB_ID --remote",
    "db:migrate:local": "wrangler d1 migrations apply YOUR_DB_ID --local"
  },
  "devDependencies": {
    "wrangler": "^4.53.0"
  }
}
```

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
├── src/
│   ├── worker.js        # Cloudflare Worker API (REQUIRED)
│   ├── App.vue          # Main game component
│   └── ...              # Other source files
├── migrations/          # Database migrations (REQUIRED)
│   └── 0001_initial_schema.sql
├── public/              # Static assets
├── tests/               # Test files
├── package.json         # Dependencies (must include wrangler)
├── vercel.json          # Vercel config
├── wrangler.toml        # Cloudflare Workers config (REQUIRED)
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

### Cloudflare Workers (REQUIRED)

**All games must deploy a Cloudflare Worker for API functionality.**

1. **Create the D1 database:**
```bash
cd games/your-game-name
wrangler d1 create your-game-data
```
This will output a `database_id`. Update `wrangler.toml` with this ID.

2. **Apply migrations:**
```bash
# Apply to remote (production) database
wrangler d1 migrations apply YOUR_DB_ID --remote

# Or apply to local database for testing
wrangler d1 migrations apply YOUR_DB_ID --local
```

3. **Deploy the worker:**
```bash
npm run deploy:worker
```

The worker will be available at: `https://your-game-api.your-account.workers.dev`

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

# 4. Create wrangler.toml (REQUIRED)
cat > wrangler.toml << 'EOF'
name = "tic-tac-toe-api"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "tic-tac-toe-data"
# Update with database_id after: wrangler d1 create tic-tac-toe-data

vars = { AUTH_API_URL = "https://narduk-games-auth-api.narduk.workers.dev" }
EOF

# 5. Create src/worker.js (REQUIRED)
# See examples in lexi-stack, wordle-clone, or stack-balance

# 6. Create migrations/0001_initial_schema.sql (REQUIRED)
mkdir migrations
cat > migrations/0001_initial_schema.sql << 'EOF'
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
EOF

# 7. Install wrangler
npm install --save-dev wrangler

# 8. Update package.json scripts (add deploy:worker, db:migrate)

# 9. Update root package.json (manually add scripts)

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
- **For Cloudflare Workers:**
  - Ensure `wrangler.toml` exists and is properly configured
  - Verify database ID is set in `wrangler.toml`
  - Run migrations before deploying: `npm run db:migrate`
  - Check worker deployment status in Cloudflare dashboard

### Import Issues

- Use relative paths for local imports
- For shared utilities, use paths from the root
- Ensure file extensions are included for ES modules

## Need Help?

- Check existing games in `games/` for examples
- Review the root `README.md` for overall structure
- Open an issue on GitHub if you encounter problems

Happy game building! 🎮
