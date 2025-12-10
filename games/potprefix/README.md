# PotPrefix

A simple, addictive word-building game. Build word chains by adding prefix letters to form longer words. Score points based on word length, chain length, and rare letters. Built with Vue 3, TypeScript, Vite, Pinia, and Tailwind CSS.

## How to Play
- Start with a seed word (e.g., "INK")
- Tap a letter to add it as a prefix (e.g., "L" + "INK" = "LINK")
- If the preview word is valid (shown in green), tap "Build Word" to add it to your chain
- Keep building longer chains for higher scores!
- Longer words and longer chains earn more points
- Rare letters (Q, Z, J, X) give bonus points

## Scoring
- Base points: Word length × 10
- Chain position bonus: +5 per position in chain
- Rare letter bonus: +20 per rare letter
- Chain length multipliers:
  - 5+ words: ×1.5
  - 10+ words: ×2
  - 15+ words: ×3

## Tech & Structure
- Vue 3 + Vite (TypeScript)
- Pinia store handling score, chain, and word validation (`src/stores/potprefix.ts`)
- Local trie stub for offline validation (`src/utils/trie.ts`); swap with the 100k dictionary later
- Tailwind CSS styling with neon accents
- Router for Home, Game, Auth, and End screens

## Scripts
```bash
npm install      # install dependencies
npm run dev      # local dev server
npm run build    # type-check and build for production
npm run test     # vitest suite
```

## Game Modes
- **Endless**: Build chains as long as possible, beat your high score
- **Challenge**: Build a chain of 10 words (coming soon)
- **Timed**: Build as many words as possible in 60 seconds (coming soon)

## Next Steps
- Expand trie to the full dictionary
- Add daily seeds from D1
- Add vibration feedback and PWA manifest/service worker for iPhone
- Leaderboards for daily mode and timed rushes
- Cloudflare Worker auth and score sync
