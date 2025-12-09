# Stack & Balance

A physics-based stacking game built with Three.js and Rapier.js. Build the tallest tower possible by carefully placing blocks!

## Features

- 🎮 **Physics-Based Gameplay** - Realistic block physics using Rapier.js
- 📱 **Mobile Optimized** - Touch controls designed for iPhone
- 🎨 **Beautiful 3D Graphics** - Three.js rendering with shadows and lighting
- ⭐ **Scoring System** - Height bonuses, combos, and perfect placement rewards
- 🎯 **Progressive Difficulty** - Blocks get trickier as you stack higher
- ✨ **Particle Effects** - Visual feedback for placements and collapses

## Controls

### Mobile (Touch)
- **Tap** - Drop the block
- **Swipe Left/Right** - Rotate block around Y-axis
- **Swipe Up/Down** - Rotate block around X-axis
- **Pinch** - Zoom camera (optional)
- **Two-finger drag** - Rotate camera view

### Desktop
- **Spacebar** - Drop block
- **Arrow Keys** - Rotate block
- **Mouse Drag** - Rotate camera
- **Scroll Wheel** - Zoom camera

## How to Play

1. A block appears above the platform
2. Swipe to rotate the block to your desired orientation
3. Tap to drop the block
4. Build as high as possible without the tower collapsing
5. Earn points for height and consecutive placements (combo multiplier)

## Scoring

- **Base Points**: 10 points per block
- **Height Bonus**: 5 points per block height
- **Combo Multiplier**: Increases by 0.1x for each successful placement (max 5.0x)
- **Perfect Placement**: Bonus points for center alignment

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Technical Details

- Built with Vue 3 and Vite
- Three.js for 3D rendering
- Rapier.js for physics simulation
- Optimized for mobile performance (60fps target)
- Uses shared utilities from the monorepo

## Performance Optimizations

- Pixel ratio capped at 2x for mobile
- Physics bodies set to sleep when settled
- Efficient particle system with automatic cleanup
- Shadow maps optimized for performance

