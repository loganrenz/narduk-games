# Stack & Balance - Complete Game Specification

## Game Overview
Stack & Balance is a physics-based stacking game where players drop 3D blocks onto a platform to build the tallest, most stable tower possible. Players control block rotation and drop timing using intuitive touch controls optimized for iPhone. The game features realistic physics, satisfying particle effects, and progressively challenging block shapes.

## Core Game Mechanics

### Block System
- **Block Shapes**: Various 3D geometries
  - Standard: Cube, Rectangular prism
  - Intermediate: Cylinder, L-shape, T-shape
  - Advanced: Spheres, Irregular shapes, U-shapes
- **Block Sizes**: Uniform base size, varying heights (0.5x to 2x standard)
- **Block Colors**: 
  - Default: Vibrant colors (blue, green, purple, orange)
  - Gradient patterns based on shape type
  - Emissive glow effects

### Physics System
- **Engine**: Rapier.js (optimized for mobile performance)
- **Gravity**: Standard physics gravity (9.81 m/s²)
- **Friction**: Realistic friction between blocks and platform
- **Restitution**: Low bounce (0.1-0.3) for stable stacking
- **Collision Detection**: Precise mesh-to-mesh collision
- **Sleep Threshold**: Blocks become static after settling (performance optimization)

### Block Spawning
- **Spawn Location**: Above the tower (2-3 block heights)
- **Initial Velocity**: Zero (free fall only)
- **Spawn Frequency**: Block appears when previous settles
- **Preview**: Next block type shown in UI

### Scoring System
**Base Points:**
- Each successful placement: 10 points
- Height bonus: 5 points per block height
- Perfect center alignment: +25 bonus

**Multiplier:**
- Starts at 1.0x
- Increases by 0.1x for each consecutive successful placement
- Resets to 1.0x on collapse
- Maximum multiplier: 5.0x

**Combo System:**
- Consecutive placements without collapse: Combo counter increases
- Combo display: Visual indicator showing current streak
- Bonus points: Combo × base points

## User Interface Requirements

### Visual Layout
- **Portrait Orientation**: Primary mode (optimized for iPhone)
- **Camera Angle**: 45-degree isometric view (adjustable)
- **Background**: Sky blue gradient
- **Platform**: Visible base platform
- **UI Overlay**: Minimal, non-intrusive

### Stats Display
**Top Bar:**
- Score (large, prominent)
- Height (blocks stacked)
- Combo multiplier (x1.0 format)
- Next block preview

### Controls Display
- Touch zones shown subtly
- Rotation guide: Arrow indicators for swipe direction
- Controls hint that fades after first placement

## Interaction Models

### Touch Controls (Primary - iPhone)

**Tap to Drop:**
- Single tap anywhere: Drops current block immediately
- Visual feedback: Button press animation
- Responsive: Instant drop on tap

**Swipe to Rotate:**
- Swipe left: Rotate block 90° around Y-axis (counter-clockwise)
- Swipe right: Rotate block 90° around Y-axis (clockwise)
- Swipe up: Rotate block 90° around X-axis (forward)
- Swipe down: Rotate block 90° around X-axis (backward)
- Smooth animation: Rotation completes in 0.2 seconds

### Desktop Controls (Fallback)
- **Spacebar**: Drop block
- **Arrow Keys**: Rotate block (left/right = Y-axis, up/down = X-axis)
- **Mouse Drag**: Rotate camera
- **Scroll Wheel**: Zoom camera

### Camera Controls
- **Default**: Isometric view at 45° angle
- **Auto-follow**: Camera smoothly follows tower height
- **Manual adjustment**: Two-finger drag to orbit
- **Zoom**: Pinch gesture or scroll wheel

## Visual Feedback States

### Block States
**Idle (in air):**
- Normal color and lighting
- Subtle emissive glow
- Preview shadow on platform

**Dropping:**
- Shadow becomes more defined

**Landed Successfully:**
- Particle burst at contact point
- Score popup animation

**Collapse:**
- Blocks fall with physics
- Particle explosions on impact
- Screen flash effect
- "Game Over" overlay appears

### Particle Effects
**Placement Success:**
- Small particle burst at contact
- Particles float upward with gravity
- Color matches block color

**Collapse:**
- Large particle explosions for each block
- Debris particles
- Multi-colored particles

## Three.js Implementation Details

### Scene Setup
- **Renderer**: WebGLRenderer with mobile optimizations
  - Antialiasing: Enabled
  - Pixel ratio: Clamped to devicePixelRatio (max 2 for performance)
  - Shadow map: PCF soft shadows
  
- **Camera**: PerspectiveCamera
  - FOV: 50 degrees
  - Near: 0.1
  - Far: 1000
  - Position: Calculated based on tower height

- **Lighting**:
  - Ambient light: Soft fill light (intensity 0.6)
  - Directional light: Main sun light (intensity 0.8, casts shadows)

### Block Rendering
- **Geometry**: 
  - BoxGeometry for cubes/rectangles
  - CylinderGeometry for cylinders

- **Materials**:
  - MeshStandardMaterial
  - Metallic: 0.3-0.5
  - Roughness: 0.4-0.6
  - Color: Varies by block type
  - Emissive: Slight glow on all blocks

- **Shadows**: 
  - Cast shadows: Enabled
  - Receive shadows: Enabled on platform

### Physics Integration
- **Library**: Rapier.js
- **World**: Physics world runs independently from render loop
- **Bodies**: One physics body per block
- **Sync**: Physics positions synced to Three.js meshes each frame
- **Sleeping**: Inactive bodies set to sleep mode for performance

### Performance Optimizations
- **Pixel Ratio Cap**: Maximum 2x for mobile devices
- **Shadow Maps**: Optimized size (2048x2048)
- **Particle Limits**: Automatic cleanup after animation
- **Frame Rate**: Target 60fps, gracefully degrade to 30fps if needed
- **Memory Management**: Dispose geometries/materials when blocks fall off screen

## Game Flow

### Game Start
1. Show tutorial overlay (first time only)
2. Initialize physics world
3. Spawn first block above platform
4. Wait for player input
5. Camera focuses on platform

### During Gameplay
1. Player rotates block (swipe gesture)
2. Player drops block (tap)
3. Block falls with physics
4. On landing: Calculate stability
5. If stable: Award points, spawn next block
6. If unstable: Trigger collapse sequence
7. Update camera to follow tower
8. Repeat

### Game Over
1. Collapse detected
2. Play collapse animation (2-3 seconds)
3. Show game over overlay
4. Display final stats:
   - Final height
   - Total score
   - Best combo
   - Blocks placed
5. Options: Play Again, Main Menu

## Progressive Difficulty

### Block Complexity
- **Level 1-5**: Simple cubes and rectangles only
- **Level 6-10**: Add cylinders and L-shapes
- **Level 11-15**: Add T-shapes and irregular shapes
- **Level 16+**: Mix of all shapes, weighted/unbalanced blocks

## Statistics Tracking
- **Height Reached**: Highest block count
- **Total Blocks Placed**: Lifetime count
- **Best Combo**: Highest combo multiplier achieved
- **Perfect Placements**: Count of perfectly centered blocks
- **Games Played**: Total games completed
- **Total Score**: Lifetime score accumulation

## Mobile Optimization Checklist

### Performance
- ✅ 60fps target, 30fps minimum
- ✅ Efficient physics simulation (Rapier.js)
- ✅ Limited particle count with cleanup
- ✅ Optimized shadow rendering
- ✅ Pixel ratio capped at 2x
- ✅ Physics bodies sleep when settled

### Touch Controls
- ✅ Large tap targets (full screen)
- ✅ Responsive swipe detection
- ✅ Visual feedback on all interactions
- ✅ No accidental drops during rotation
- ✅ Touch action prevention for gestures

### Battery
- ✅ Efficient rendering (requestAnimationFrame)
- ✅ Physics step optimization
- ✅ Particle system cleanup
- ✅ Shadow map size optimization

