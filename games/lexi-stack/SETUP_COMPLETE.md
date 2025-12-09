# Cloudflare D1 Setup Status

## ✅ Completed

1. **Database Schema Created** - All tables are set up:
   - ✅ `users` table
   - ✅ `scores` table  
   - ✅ `words` table
   - ✅ Indexes created for performance

2. **Worker Code Ready** - API endpoints are configured:
   - `POST /api/user` - Create/get user
   - `POST /api/scores` - Submit score
   - `GET /api/scores` - Get leaderboard
   - `POST /api/words` - Track word usage
   - `GET /api/stats` - Get statistics

## ⚠️ Manual Step Required

**Register Workers.dev Subdomain:**

1. Go to: https://dash.cloudflare.com/d715f0aeb6b2e7b10f54e9e72fba8fdd/workers/onboarding
2. Register a workers.dev subdomain (one-time setup)
3. Then run: `npx wrangler deploy`

Alternatively, you can deploy to a custom route by adding to `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## After Deployment

Once deployed, you'll get a URL like:
`https://lexi-stack-api.YOUR_SUBDOMAIN.workers.dev`

Then update `src/api.js`:
```javascript
const API_BASE_URL = 'https://lexi-stack-api.YOUR_SUBDOMAIN.workers.dev';
```

## Test the Database

You can verify the schema was created:
```bash
npx wrangler d1 execute lexistack --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Next Steps

1. Register workers.dev subdomain (link above)
2. Deploy: `npx wrangler deploy`
3. Update API URL in `src/api.js`
4. Integrate API calls into your game!

