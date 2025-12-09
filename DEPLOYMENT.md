# Deployment Guide

This guide explains how to deploy the Narduk Games monorepo to Vercel.

## Overview

The Narduk Games monorepo uses a multi-project deployment strategy:
- **Landing Page**: Deployed from the root directory
- **Individual Games**: Each game is deployed as a separate Vercel project

## Prerequisites

- [Vercel CLI](https://vercel.com/download) installed
- Vercel account
- Cloudflare account (for games using D1 database)

## Deployment Strategy

### Option 1: Separate Projects (Recommended)

Each game is deployed as its own Vercel project with its own domain/subdomain.

**Advantages:**
- Independent deployments
- Separate build caches
- Individual environment variables
- Better isolation

**Setup:**

1. **Deploy Landing Page** (narduk.games):
   ```bash
   # From root directory
   vercel --prod
   ```

2. **Deploy Lexi-Stack** (lexi-stack.narduk.games or separate domain):
   ```bash
   cd games/lexi-stack
   vercel --prod
   ```

3. **Deploy Wordle Clone** (wordle.narduk.games or separate domain):
   ```bash
   cd games/wordle-clone
   vercel --prod
   ```

### Option 2: Single Project with Multiple Outputs

Deploy all games from a single Vercel project using multiple outputs.

**Note:** This is more complex and not recommended for this monorepo structure.

## Step-by-Step: Deploying Individual Projects

### 1. Landing Page Deployment

```bash
# From repository root
cd /home/runner/work/narduk-games/narduk-games

# Login to Vercel (if not already logged in)
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? narduk-games-hub (or your preferred name)
# - Directory? . (root)
```

**Custom Domain Setup:**
- Go to Vercel Dashboard → Project Settings → Domains
- Add your custom domain (e.g., `narduk.games`)
- Configure DNS at Cloudflare (CNAME or A record)

### 2. Lexi-Stack Deployment

```bash
cd games/lexi-stack

# Deploy
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? lexi-stack
# - Directory? . (current directory)
```

**Environment Variables:**
If Lexi-Stack needs environment variables:
```bash
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_D1_DATABASE_ID
```

**Custom Domain:**
- Add subdomain: `lexi-stack.narduk.games`
- Or use separate domain: `lexistack.com`

### 3. Wordle Clone Deployment

```bash
cd games/wordle-clone

# First, initialize the game if not done yet
npm create vite@latest . -- --template vue
npm install

# Then deploy
vercel --prod
```

## Cloudflare Workers & D1 Setup

Some games (like Lexi-Stack) use Cloudflare Workers for API and D1 for database.

### Deploy Worker

```bash
cd games/lexi-stack

# Deploy worker
npm run deploy:worker
# or
wrangler deploy
```

### Apply Database Migrations

```bash
cd games/lexi-stack

# Apply migrations to production
npm run db:migrate
# or
wrangler d1 migrations apply [database-id] --remote
```

### Get Database ID

```bash
wrangler d1 list
```

## Domain Configuration

### Root Domain (Landing Page)
```
narduk.games → Vercel (narduk-games-hub project)
```

### Game Subdomains
```
lexi-stack.narduk.games → Vercel (lexi-stack project)
wordle.narduk.games → Vercel (wordle-clone project)
```

### Cloudflare DNS Settings

Add CNAME records in Cloudflare:

```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: Yes/No (your choice)

Type: CNAME
Name: lexi-stack
Target: cname.vercel-dns.com
Proxy: Yes/No (your choice)

Type: CNAME
Name: wordle
Target: cname.vercel-dns.com
Proxy: Yes/No (your choice)
```

## Vercel Project Configuration

### Landing Page Project Settings

**Build & Development Settings:**
- Build Command: `echo 'No build needed'`
- Output Directory: `.`
- Install Command: `echo 'No dependencies'`

**Environment Variables:**
None needed for landing page.

### Lexi-Stack Project Settings

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Framework Preset: `Vite`

**Environment Variables:**
- `VITE_API_BASE_URL`: Your Cloudflare Worker URL
- Any other game-specific variables

### Wordle Clone Project Settings

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Framework Preset: `Vite`

## Continuous Deployment

### GitHub Integration

Connect your repository to Vercel for automatic deployments:

1. Go to Vercel Dashboard
2. Import Git Repository
3. Select `loganrenz/narduk-games`
4. Configure project:
   - For landing page: Root Directory = `.`
   - For lexi-stack: Root Directory = `games/lexi-stack`
   - For wordle: Root Directory = `games/wordle-clone`

### Branch Deployments

- `main` branch → Production
- Other branches → Preview deployments

## Testing Deployments

### Local Preview

Before deploying, test locally:

```bash
# Landing page
python3 -m http.server 8000

# Lexi-Stack
cd games/lexi-stack
npm run dev

# Wordle Clone
cd games/wordle-clone
npm run dev
```

### Preview Deployments

Deploy to preview environment:

```bash
vercel
# (without --prod flag)
```

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify build command is correct
3. Ensure all dependencies are in package.json
4. Test build locally: `npm run build`

### Domain Not Working

1. Verify DNS settings in Cloudflare
2. Check domain configuration in Vercel
3. Wait for DNS propagation (up to 48 hours)
4. Use [DNS Checker](https://dnschecker.org/) to verify

### Environment Variables Not Working

1. Check they're set in Vercel project settings
2. Redeploy after adding variables
3. Verify variable names match code

### Worker Deployment Fails

1. Check wrangler.toml configuration
2. Verify Cloudflare credentials
3. Run `wrangler login` to re-authenticate
4. Check Cloudflare account limits

## Maintenance

### Updating Games

1. Make changes in the game directory
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy: `vercel --prod` or push to GitHub (if CI/CD enabled)

### Adding New Games

1. Follow instructions in [ADDING_GAMES.md](./ADDING_GAMES.md)
2. Create new Vercel project for the game
3. Configure domain/subdomain
4. Set up environment variables if needed
5. Deploy: `vercel --prod`

### Database Migrations

When adding new database features:

```bash
cd games/[game-name]

# Create migration
wrangler d1 migrations create [database-id] [migration-name]

# Apply locally for testing
npm run db:migrate:local

# Apply to production
npm run db:migrate
```

## Cost Considerations

### Vercel
- Free tier: Sufficient for small games
- Pro tier: If you need more bandwidth/builds

### Cloudflare
- Workers: Free tier includes 100k requests/day
- D1: Free tier includes 5 GB storage
- DNS: Free

## Security

### Environment Variables
- Never commit secrets to Git
- Use Vercel's environment variable management
- Rotate credentials regularly

### API Keys
- Store in Vercel environment variables
- Use different keys for preview/production
- Restrict API keys by domain when possible

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/)

## Quick Reference

```bash
# Deploy landing page
vercel --prod

# Deploy lexi-stack
cd games/lexi-stack && vercel --prod

# Deploy worker
cd games/lexi-stack && npm run deploy:worker

# Run migrations
cd games/lexi-stack && npm run db:migrate

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```
