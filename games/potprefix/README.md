# PotPrefix

Solo prefix ladder word game with a gambling twist. Ante chips, add a prefix letter to form a valid word, and decide
whether to cash out or keep risking the growing pot. Built with Vue 3, TypeScript, Vite, Pinia, and Tailwind CSS.

## Core Loop
- Start from a seed word and an empty pot
- Tap a letter to preview the prefixed word; green previews are valid from the local trie
- Choose an ante (10/50/100/all-in) and tap **Risk It** to grow the pot with chain multipliers
- Cash out at any time to bank chips or push the chain for jackpots; busting wipes the pot

## Tech & Structure
- Vue 3 + Vite (TypeScript)
- Pinia store handling bankroll, pot, chain multipliers, and busts (`src/stores/potprefix.ts`)
- Local trie stub for offline validation (`src/utils/trie.ts`); swap with the 100k dictionary later
- Tailwind CSS styling with casino-inspired accents
- Router stubs for Home, Game, Auth, and End screens

## Scripts
```bash
npm install      # install dependencies
npm run dev      # local dev server
npm run build    # type-check and build for production
npm run test     # vitest suite (placeholder)
```

## Next Steps
- Wire Cloudflare Worker auth (`/auth/login`) and bankroll sync (`/chips/update`)
- Expand trie to the full dictionary and add daily seeds from D1
- Add vibration feedback and PWA manifest/service worker for iPhone
- Leaderboards for daily mode and timed rushes
