# TapWeave

TapWeave is a word insertion chain-builder designed for the Narduk Games monorepo. The game focuses on touch-first play, quick letter insertion, and asynchronous multiplayer with Cloudflare Workers.

## Tech Stack
- **Frontend:** Vue 3 (Composition API) + TypeScript via Vite, Tailwind CSS for styling, VueUse utilities, Pinia for state, Vitest for tests.
- **Backend:** Cloudflare Workers with D1 (SQLite) for authentication, invites, and async turn storage. JWT or email-based login flows. Wrangler CLI for development/deploy.
- **Dictionary:** Embedded ~100k-word Trie implemented in TypeScript; shareable via `shared/` utilities.
- **Platforms:** PWA optimized for iPhone, deployable to web via Vercel.
- **Offline:** Core gameplay works offline; online sync for scores/invites.

## Game Overview
- **Genre:** Word puzzle / chain-builder.
- **Core Loop:** Start from a 3–5 letter seed word. Tap to insert a letter anywhere to form a valid new word and extend the chain.
- **Scoring:** Ignite points gained per successful insertion, bold multiplier (x1.5), chain bonuses, and +20% bonus when authenticated.
- **Power-Ups:** Hints request from the Worker (costs 1 point) to suggest a viable move.
- **Monetization:** Free core; future optional IAP for hints/themes via Stripe. No ads.

## Game Modes
- **Single-Player:** Endless, Timed, and Zen. Local-first saves with optional cloud sync when logged in.
- **Hot-Seat:** Local pass-and-play.
- **Async Online:** Two-player alternating turns stored in D1. Invites trigger Worker emails/notifications and include a shareable link/QR.

## UI / UX
- **Main Screens:**
  - `Home.vue`: Logo, mode buttons, login prompt, profile high scores from D1.
  - `Game.vue`: Header for chain/score/lives, word display with tap spots, alphabet grid for insertion, turn indicator, and “Invite Friend” button.
  - `Auth.vue`: Email/password or magic-link login with guest toggle.
  - `InviteModal.vue`: Friend email input, POST to Worker to create invite, returns link/QR (via `qrcode.vue`).
  - `End.vue`: Results, replay, share, and leaderboard/login prompts.
- **Interactions:** Touch taps, swipe to scroll history, Vibration API haptics, Vue transitions (GSAP optional), ARIA labels, Vue-i18n ready, dark/light mode via VueUse.

## Backend Integration
- **Authentication:** Worker endpoints handle `/auth/login` and `/auth/register` with JWT issuance and storage in D1. Frontend composable stores token in Pinia/localStorage and attaches it as Bearer auth.
- **Invites & Async Turns:**
  - `/invite/create` creates a game in D1 with a generated game ID and seeded chain, emailing the invite link.
  - `/invite/:id` fetches pending invites; `/game/update` appends validated turns and notifies the opponent.
  - Rate-limit invites (e.g., 1/min) and validate JWT on all routes.
- **Schema (migrations/0001.sql):**
  ```sql
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE, token TEXT);
  CREATE TABLE games (id TEXT PRIMARY KEY, player1 TEXT, player2 TEXT, chain JSON, current_turn TEXT);
  ```
- **Workers Config:** `wrangler.toml` binds the `D1` database and sets `JWT_SECRET`/email provider keys.

## Development & Deployment
- **Directory:** `games/tapweave/`
- **Init:** `npm create vite@latest . -- --template vue-ts` followed by `npm install`.
- **Local Scripts:** `npm run dev`, `npm run build`, `npm run test`, `npm run deploy:worker`, `npm run db:migrate` (Wrangler).
- **Frontend Deploy:** `vercel --prod` from `games/tapweave` → `https://tapweave.narduk.games`.
- **Backend Deploy:** `npm run deploy:worker`; run D1 migrations with `npm run db:migrate`.

## Implementation Notes
- Prioritize core loop and offline play for MVP; add async multiplayer after single-player/hot-seat are stable.
- Use shared Trie/auth helpers from `shared/` where possible.
- Include screenshots and mode descriptions in this README as the game UI evolves.
