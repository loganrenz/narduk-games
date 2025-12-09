# Cloudflare D1 Database Setup

This project uses Cloudflare D1 for storing user scores and word tracking.

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
# or
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create the Database Schema

```bash
# Apply migrations
npm run db:migrate

# Or manually execute SQL
npm run db:create
```

### 4. Deploy the Worker

```bash
npm run deploy:worker
```

This will deploy your Cloudflare Worker and give you a URL like:
`https://lexi-stack-api.YOUR_SUBDOMAIN.workers.dev`

### 5. Update API URL

Edit `src/api.js` and replace `YOUR_SUBDOMAIN` with your actual Worker subdomain.

### 6. Integrate with Game

The API functions in `src/api.js` can be imported and used in your game to:
- Create/get users
- Submit scores
- Get leaderboards
- Track word usage
- Get statistics

## Database Schema

- **users**: User accounts with username
- **scores**: Game scores linked to users
- **words**: Word usage tracking

## API Endpoints

- `POST /api/user` - Create or get user
- `POST /api/scores` - Submit score
- `GET /api/scores` - Get leaderboard
- `POST /api/words` - Track word usage
- `GET /api/stats` - Get statistics

