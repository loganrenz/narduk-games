# Unified Authentication System

This directory contains the unified authentication system for all Narduk games.

## Architecture

The authentication system follows industry best practices for multi-game platforms:

- **Single Auth Database**: `narduk-games-auth` - Central user identity management
- **Separate Game Databases**: Each game has its own data database
- **Unified Auth API**: Single worker handles all authentication
- **Shared Client Library**: Reusable auth functions for all games

## Structure

```
shared/auth/
├── worker.js                    # Auth API worker (Cloudflare Worker)
├── wrangler.toml                # Worker configuration
├── client.js                    # Shared auth client library
├── migrations/
│   ├── 0001_auth_schema.sql     # Auth database schema
│   └── migrate-lexi-stack-users.js  # User migration script
└── README.md                    # This file
```

## Database Schema

### Users Table
- `id` (TEXT PRIMARY KEY) - Unique user identifier
- `username` (TEXT UNIQUE NOT NULL) - Username
- `displayname` (TEXT) - Display name
- `password_hash` (TEXT) - Hashed password (SHA-256)
- `created_at` (INTEGER) - Creation timestamp
- `updated_at` (INTEGER) - Last update timestamp

### Sessions Table (Future)
- `id` (TEXT PRIMARY KEY) - Session identifier
- `user_id` (TEXT NOT NULL) - User ID
- `token` (TEXT UNIQUE NOT NULL) - Session token
- `expires_at` (INTEGER) - Expiration timestamp
- `created_at` (INTEGER) - Creation timestamp

## API Endpoints

Base URL: `https://narduk-games-auth-api.narduk.workers.dev`

### Create or Get User
```
POST /api/auth/user
Body: { username, password?, userId? }
Response: { user: { id, username, displayname, created_at } }
```

### Get User
```
GET /api/auth/user?username=<username>
GET /api/auth/user?userId=<userId>
Response: { user: { id, username, displayname, created_at } }
```

### Check Username Availability
```
GET /api/auth/check-username?username=<username>
Response: { available: boolean, exists: boolean, taken: boolean }
```

### Login
```
POST /api/auth/login
Body: { username, password }
Response: { user: { id, username, displayname, created_at } }
```

### Update User
```
PATCH /api/auth/user
Body: { userId, displayname?, password?, currentPassword? }
Response: { user: { id, username, displayname, created_at } }
```

## Usage

### In Games

Import the shared auth client:

```javascript
import { getOrCreateUser, login, getUser } from '../../../shared/auth/client.js';

// Get or create user
const user = await getOrCreateUser('username', existingUserId);

// Login
const user = await login('username', 'password');

// Get user
const user = await getUser(null, userId);
```

### Direct API Calls

```javascript
const response = await fetch('https://narduk-games-auth-api.narduk.workers.dev/api/auth/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'myuser' })
});
const data = await response.json();
```

## Setup

### 1. Create Database

```bash
wrangler d1 create narduk-games-auth
```

Update `wrangler.toml` with the database_id.

### 2. Apply Migrations

```bash
wrangler d1 execute narduk-games-auth --remote --file=./migrations/0001_auth_schema.sql
```

### 3. Deploy Worker

```bash
wrangler deploy
```

### 4. Migrate Existing Users

If migrating from lexi-stack:

```bash
node migrations/migrate-lexi-stack-users.js
```

## Security Notes

- Passwords are hashed using SHA-256 (consider upgrading to bcrypt/argon2 for production)
- CORS is enabled for all origins (restrict in production if needed)
- No session management yet (sessions table is prepared for future use)
- User validation should be done at the application level for game data

## Game Integration

Each game should:

1. Use the shared auth client for user operations
2. Validate user_id exists in auth DB before storing game data
3. Reference user_id in game data tables (no foreign keys across databases)
4. Fetch usernames from auth API when displaying leaderboards

Example (Lexi-Stack):

```javascript
// In game API worker
async function handleSubmitScore(request, db, authApiUrl) {
  const { userId, score } = await request.json();
  
  // Validate user exists
  const authResponse = await fetch(`${authApiUrl}/api/auth/user?userId=${userId}`);
  if (!authResponse.ok) {
    return new Response(JSON.stringify({ error: 'Invalid user' }), { status: 401 });
  }
  
  // Store score
  await db.prepare('INSERT INTO scores (id, user_id, score) VALUES (?, ?, ?)')
    .bind(crypto.randomUUID(), userId, score)
    .run();
}
```

## Future Enhancements

- [ ] Session management with JWT tokens
- [ ] Password reset functionality
- [ ] Email verification
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Rate limiting
- [ ] Better password hashing (bcrypt/argon2)
- [ ] User roles and permissions

