# Quick Setup Guide for Cloudflare D1

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Login to Cloudflare

```bash
npx wrangler login
```

## Step 3: Create Database Schema

Run the migration to create tables:

```bash
npm run db:create
```

This will create:
- `users` table for user accounts
- `scores` table for game scores
- `words` table for word tracking

## Step 4: Deploy the Worker

```bash
npm run deploy:worker
```

After deployment, you'll get a URL like:
`https://lexi-stack-api.YOUR_SUBDOMAIN.workers.dev`

## Step 5: Update API URL in Code

Edit `src/api.js` and replace:
```javascript
const API_BASE_URL = 'https://lexi-stack-api.YOUR_SUBDOMAIN.workers.dev';
```

With your actual Worker URL.

## Step 6: Test the API

You can test the endpoints:

```bash
# Create a user
curl -X POST https://YOUR_WORKER_URL/api/user \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# Submit a score
curl -X POST https://YOUR_WORKER_URL/api/scores \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "score": 1000, "combo": 2.5, "level": 5}'

# Get leaderboard
curl https://YOUR_WORKER_URL/api/scores?limit=10
```

## Database Schema

### users
- `id` (TEXT PRIMARY KEY) - Unique user ID
- `username` (TEXT UNIQUE) - Username
- `created_at` (INTEGER) - Timestamp

### scores
- `id` (TEXT PRIMARY KEY) - Score ID
- `user_id` (TEXT) - Foreign key to users
- `score` (INTEGER) - Game score
- `combo` (REAL) - Best combo multiplier
- `longest_word` (TEXT) - Longest word formed
- `level` (INTEGER) - Level reached
- `words_played` (INTEGER) - Number of words formed
- `created_at` (INTEGER) - Timestamp

### words
- `word` (TEXT PRIMARY KEY) - The word
- `times_used` (INTEGER) - How many times used
- `last_used_at` (INTEGER) - Last usage timestamp

## Next Steps

Once the API is deployed, you can integrate it into your game by:
1. Importing functions from `src/api.js`
2. Calling `getOrCreateUser()` when game starts
3. Calling `submitScore()` when game ends
4. Calling `getLeaderboard()` to show top scores
5. Optionally calling `trackWord()` for analytics

