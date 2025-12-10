# TapWeave - Game Specification

## Overview
TapWeave is a word-building puzzle game where players create chains of words by inserting exactly one letter at a time into the current word to form a new valid word.

## Core Mechanics

### Word Chain Building
1. Start with a seed word (3-5 letters)
2. Insert exactly ONE letter at any position
3. The result must be a valid English word
4. The new word becomes the current word
5. Repeat to build the longest chain possible

### Example Chain
```
CAT → CART (insert R at position 2)
CART → CRATE (insert E at position 4) 
CRATE → CREATE (insert E at position 2)
CREATE → CREATED (insert D at position 6)
```

## Game Modes

### 1. Endless Mode ♾️
- **Objective**: Build the longest chain possible
- **Lives**: 3 lives
- **End Condition**: All lives lost (invalid words cost 1 life)
- **Scoring**: Points based on word length

### 2. Timed Mode ⏱️
- **Objective**: Maximum score in 3 minutes
- **Time Limit**: 180 seconds
- **Lives**: 3 lives
- **End Condition**: Timer runs out OR all lives lost
- **Scoring**: Points based on word length

### 3. Zen Mode 🧘
- **Objective**: Explore and experiment
- **Lives**: Unlimited
- **Time Limit**: None
- **End Condition**: Player chooses to quit
- **Scoring**: Points tracked but no pressure

### 4. Hot Seat Mode 👥
- **Objective**: Local multiplayer pass-and-play
- **Players**: 2+ players take turns
- **Lives**: Shared pool or individual
- **End Condition**: Configurable
- **Scoring**: Individual scores tracked

## Scoring System

### Base Score
- Word length × 10 points
- Example: "CATS" (4 letters) = 40 points

### Length Bonus
- Words longer than 5 letters get bonus points
- Bonus = (length - 5) × 5
- Example: "CREATE" (6 letters) = 60 + 5 = 65 points

### Total Formula
```
Score = (length × 10) + max(0, (length - 5) × 5)
```

## Dictionary & Validation

### Word Requirements
- 3-15 letters long
- A-Z letters only (uppercase internally)
- Must exist in the game dictionary
- ~500+ common English words included

### Validation Rules
1. New word must be exactly 1 letter longer than current word
2. All letters from current word must appear in same order
3. Word must exist in dictionary
4. Only one letter can be inserted per turn

## User Interface

### Home Screen
- Game mode selection
- User authentication (optional)
- High scores display
- How to play instructions

### Game Screen
**Header**
- Current score
- Lives remaining (❤️)
- Timer (for timed mode)
- Mode indicator

**Main Play Area**
- Current word display with position markers
- Position selector (0 to word.length)
- Alphabet grid (26 letters)
- Submit and Clear buttons
- Hint button

**Word Chain Display**
- Seed word
- All previous words in chain
- Scrollable list

**Actions**
- Select position for insertion
- Choose letter from grid
- Submit word
- Request hint
- Pause/Resume
- Quit to home

### Game Over Screen
- Final score
- Chain length
- Longest word
- Play Again button
- Back to Home button

## Features

### Hints System 💡
- Request suggestions for next valid words
- Shows 3-5 possible words
- Costs points (future feature)
- Uses Trie-based word search

### Authentication
- Guest play (no account)
- Email/password registration
- Persistent high scores
- Cloud sync (future)

### Offline Support
- Dictionary cached locally
- Guest scores saved in localStorage
- Syncs when online (future)

## Technical Architecture

### Frontend
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Pinia stores
- **Build**: Vite
- **Testing**: Vitest

### Data Structures
- **Trie**: Efficient word validation and prefix search
- **Store**: Game state, auth state
- **Types**: Full TypeScript typing

### Backend (Cloudflare Workers)
- **Database**: D1 (SQLite)
- **Auth**: JWT tokens (planned)
- **API Endpoints**:
  - `/api/auth/register` - User registration
  - `/api/auth/login` - User login
  - `/api/scores` - Submit and fetch scores
  - `/api/invite/create` - Create game invite (future)
  - `/api/game/update` - Update async game (future)

### Database Schema

**users table**
```sql
- id: TEXT PRIMARY KEY
- email: TEXT UNIQUE
- password_hash: TEXT
- display_name: TEXT
- created_at: INTEGER
- last_login: INTEGER
```

**games table**
```sql
- id: TEXT PRIMARY KEY
- player1_id: TEXT
- player2_id: TEXT
- seed_word: TEXT
- chain: TEXT (JSON array)
- current_turn: TEXT
- status: TEXT
- created_at: INTEGER
- updated_at: INTEGER
```

**scores table**
```sql
- id: INTEGER PRIMARY KEY
- user_id: TEXT
- game_mode: TEXT
- score: INTEGER
- chain_length: INTEGER
- longest_word: TEXT
- created_at: INTEGER
```

## Future Features

### Planned Enhancements
- [ ] Async multiplayer (turn-based)
- [ ] Friend invitations via email/link
- [ ] Global leaderboards
- [ ] Daily challenges
- [ ] Achievement system
- [ ] Power-ups and special moves
- [ ] Different dictionary sets (easy/hard)
- [ ] Word definitions on tap
- [ ] Social sharing
- [ ] PWA with offline support
- [ ] Mobile app version

### Monetization (Optional)
- Free core gameplay
- Premium features:
  - Extra hints
  - Custom themes
  - Ad-free experience
  - Advanced statistics

## Performance

### Optimization Targets
- Dictionary loads in < 500ms
- Word validation in < 10ms
- Smooth 60fps UI
- Build size < 100KB gzipped

### Caching Strategy
- Dictionary cached in browser
- Game state in localStorage
- API responses cached where appropriate

## Accessibility

### Features
- Keyboard navigation support
- Screen reader compatible
- High contrast mode
- Touch-friendly (44px minimum targets)
- ARIA labels on interactive elements

## Browser Support

### Minimum Requirements
- Modern browsers (last 2 versions)
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Local Storage
- Fetch API

### Tested Browsers
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Deployment

### Frontend
- **Platform**: Vercel
- **Domain**: tapweave.narduk.games
- **CDN**: Vercel Edge Network

### Backend
- **Platform**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Domain**: API subdomain

### CI/CD
- Automated builds on push
- PR preview deployments
- Production deployment on merge

## Credits

**Design & Development**: Narduk Games  
**Framework**: Vue.js, Vite, Tailwind CSS  
**Hosting**: Vercel, Cloudflare  
