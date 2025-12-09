# Wordle Clone

A beautiful Wordle-inspired word guessing game with Three.js animations and all the polish from LexiStack.

## Features

- 🎨 **Beautiful UI** - Matching the aesthetic of LexiStack with gradients, shadows, and smooth animations
- 🎬 **Three.js Animations** - Smooth tile flip animations using Three.js for 3D text rendering
- 📊 **Statistics Tracking** - Track your games played, win rate, and streaks
- 📤 **Share Results** - Copy your results in the classic Wordle share format
- 🎯 **Daily Challenge** - New word every day based on the date
- ⌨️ **Keyboard Support** - Both virtual and physical keyboard input
- 💾 **Persistent State** - Game state and statistics saved to localStorage
- 📱 **Responsive Design** - Works beautifully on mobile and desktop

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## How to Play

1. Guess the 5-letter word in 6 tries
2. Each guess must be a valid 5-letter word
3. After each guess, tiles change color:
   - 🟩 **Green** = Correct letter, correct position
   - 🟨 **Yellow** = Correct letter, wrong position
   - ⬜ **Gray** = Letter not in word

## Technical Details

- Built with Vue 3 and Vite
- Three.js for 3D text rendering and animations
- Uses shared storage utilities from the monorepo
- Word list loaded from `/words.txt` (falls back to built-in list)
