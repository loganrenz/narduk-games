# 🔗 TapWeave

TapWeave is a word insertion chain-builder game where players build word chains by inserting one letter at a time to create new valid words.

## 🎮 Game Overview

Start with a seed word, then insert exactly one letter anywhere in the word to create a new valid word. Keep building the chain as long as you can!

**Example chain:**
- CAT → CART (insert R at position 2)
- CART → CRATE (insert E at position 4)
- CRATE → CREATE (insert E at position 2)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## 🎯 Game Modes

- **♾️ Endless** - Build the longest chain possible with 3 lives
- **⏱️ Timed** - Race against a 3-minute timer
- **🧘 Zen** - Unlimited lives, no pressure
- **👥 Hot Seat** - Pass-and-play local multiplayer

## 🎲 How to Play

1. You start with a seed word (e.g., "CAT")
2. Select a position in the word where you want to insert a letter
3. Choose a letter from the alphabet grid
4. Submit to create a new valid word
5. The new word becomes your current word
6. Repeat to build the longest chain!

## 💡 Tips

- Use the hint button to see possible next words
- Longer words score more points
- Each invalid word costs you a life (except in Zen mode)
- In Timed mode, you have 3 minutes to build your chain

## 🔧 Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Utilities**: VueUse
- **Testing**: Vitest
- **Backend**: Cloudflare Workers + D1 (SQLite)
- **Deployment**: Vercel (frontend) + Cloudflare (backend)

## 🗄️ Database

The game uses Cloudflare D1 for:
- User authentication
- High scores
- Async multiplayer game states
- Invitations

To set up the database:

```bash
# Run migrations locally
npm run db:migrate:local

# Run migrations in production
npm run db:migrate
```

## 🚀 Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Cloudflare Workers)

```bash
npm run deploy:worker
```

## 📝 Development Notes

- Dictionary includes ~500+ common words for validation
- Words must be 3-15 letters long
- Trie data structure for efficient word lookup
- PWA-ready with offline support (planned)

## 🔮 Future Features

- [ ] Async multiplayer (turn-based with friends)
- [ ] User accounts with cloud sync
- [ ] Leaderboards
- [ ] Daily challenges
- [ ] More game modes
- [ ] Power-ups and hints system
- [ ] Social sharing

## 📄 License

MIT

---

For full game specification, see [README_SPEC.md](./README_SPEC.md)
