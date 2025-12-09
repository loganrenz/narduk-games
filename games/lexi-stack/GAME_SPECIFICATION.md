# LexiStack Game - Complete Specification

## Game Overview
LexiStack is a real-time word puzzle game where players form words by selecting adjacent letter tiles on a grid. The game features a tower of tiles that grows upward over time, and players must clear tiles by forming valid words while managing time and preventing the tower from reaching a danger line.

## Core Game Mechanics

### Grid System
- **Grid Dimensions**: 8 columns × 10 visible rows
- **Initial State**: Game starts with 5 rows filled with random letters
- **Tile Generation**: Letters are randomly generated using weighted probability
- **Letter Distribution** (weighted):
  - E (12), A (9), I (9), O (8), N (6), R (6), T (6)
  - L (4), S (4), U (4), D (4)
  - G (3)
  - B, C, M, P, F, H, V, W, Y (2 each)
  - K, J, X, Q, Z (1 each)

### Tile Selection Rules
- Tiles must be adjacent (including diagonals) to be selected in sequence
- Adjacency definition: Two tiles are adjacent if their row difference ≤ 1 AND column difference ≤ 1 AND they are not the same tile
- Minimum word length: 2 letters
- Selection is sequential - each new tile must be adjacent to the last selected tile
- Cannot select a tile that is not adjacent to the current selection path

### Word Validation
- Words must exist in a dictionary (370k+ word list)
- Words must be 2-8 letters long
- Only uppercase letters A-Z (no apostrophes, hyphens, or special characters)
- Dictionary is loaded from `/words.txt` file (one word per line, uppercase)
- Fallback to curated word list if dictionary fails to load

### Scoring System
**Letter Point Values:**
- A, E, I, L, N, O, R, S, T, U = 1 point
- D, G = 2 points
- B, C, M, P = 3 points
- F, H, V, W, Y = 4 points
- K = 5 points
- J, X = 8 points
- Q, Z = 10 points

**Word Score Calculation:**
1. Sum letter point values
2. Apply length bonus: 1 + (word_length × 0.1)
3. Multiply by combo multiplier
4. Round to nearest integer

**Example**: Word "QUIZ" with combo 2.0
- Letter sum: Q(10) + U(1) + I(1) + Z(10) = 22
- Length bonus: 1 + (4 × 0.1) = 1.4
- Base score: 22 × 1.4 = 30.8
- Final: 30.8 × 2.0 = 61.6 → 62 points

### Combo Multiplier System
- Starts at 1.0x
- Increases by 0.1 for each valid word submitted
- Maximum combo: 5.0x
- Decay: If 5 seconds pass without submitting a valid word, combo decreases by 0.1 every 1 second until it reaches 1.0x
- Best combo is tracked separately (highest combo achieved during game)

### Time System
- Starting time: 60 seconds
- Time decreases continuously (1 second per second)
- Time bonus for valid words:
  - Minimum: 1 second
  - Maximum: 3 seconds
  - Formula: 1 + floor(word_length / 3), capped at 3
- Game ends when time reaches 0

### Row Generation System
- New row appears at the top of the grid periodically
- Initial row interval: 7 seconds
- Row interval decreases by 0.05 seconds after each new row (minimum 3 seconds)
- When new row appears:
  1. All existing rows shift down by 1
  2. New row of random letters appears at row 0
  3. Game ends if top row (row 9) already contains tiles when trying to add new row

### Gravity System
- When tiles are cleared, gravity applies
- Tiles fall down to fill empty spaces
- Gravity applies column by column (each column collapses independently)
- Tiles maintain their column but move to lowest available row

### Game Over Conditions
1. Time reaches 0
2. New row cannot be added (top row is full)

### Game State Tracking
- Score (cumulative)
- Combo multiplier (current)
- Best combo (highest achieved)
- Time remaining (seconds, decimal precision)
- Level (starts at 1, increments with time or score - implementation detail)
- Longest word found
- Selected tiles (array of tile positions and letters)
- Current word (string from selected tiles)

## User Interface Requirements

### Visual Layout
- Dark theme background (slate-950 to slate-900 gradient)
- Game canvas takes 60-65% of viewport height (minimum 400px mobile, 500px desktop)
- Stats overlay in top-right corner (collapsible)
- Timer bar at top of canvas
- Floating word feedback during drag
- Toast notifications for success/error messages

### Stats Display
**Collapsed State:**
- Small button showing current score

**Expanded State:**
- Score (formatted with commas)
- Combo multiplier (x1.0 format, emerald color)
- Time remaining (seconds, red if < 10, cyan otherwise)
- Level (blue color)

### Timer Display
- Horizontal progress bar at top of canvas
- Shows time remaining as percentage of 60 seconds
- Color coding:
  - Green/cyan: > 18 seconds
  - Amber/red: 8-18 seconds
  - Red/orange with pulse: < 8 seconds
- Text shows seconds remaining

### Tile Visualization
- 3D rendered tiles (cubes with rounded edges)
- Tiles display uppercase letter on face
- Default color: Light blue (#b9c8ff) with cyan emissive glow
- High-value letters (Q, Z, X, J): Orange/gold (#f59e0b) with yellow emissive glow
- Selected tiles: Cyan highlight (#67e8f9) with stronger glow, slightly lifted (z-offset)
- Tiles animate with slight rotation and scale pulse when selected
- Tiles smoothly animate position when falling (gravity)

### Selection Feedback
- Selected tiles visually highlighted (color change, glow, scale up)
- Visual path connecting selected tiles (cyan tube/line)
- Floating word display follows cursor/finger during drag
- Floating word shows: current word text (large) and potential score (small)

## Interaction Models

### Mobile (Touch)
1. **Touch Down**: Start drag on a tile
   - Clear any existing selection
   - If tile is valid, add to selection
   - Begin tracking drag position

2. **Touch Move**: Drag across tiles
   - Update floating word position to follow finger
   - For each tile under finger:
     - If tile is not already selected AND is adjacent to last selected tile:
       - Add tile to selection
       - Update visual feedback
   - If tile is already selected, update position but don't deselect

3. **Touch Up**: End drag
   - If 2+ tiles selected: Auto-submit word
   - If < 2 tiles selected: Clear selection
   - Hide floating word feedback
   - Reset drag state

### Desktop (Mouse)
1. **Mouse Down**: Start drag on a tile
   - Same as touch down

2. **Mouse Move** (while button held): Drag across tiles
   - Same as touch move

3. **Mouse Up**: End drag
   - Same as touch up

### Keyboard Support (Optional)
- Arrow keys / WASD: Move cursor
- Enter / Space: Toggle tile at cursor
- Ctrl+Enter: Submit current selection
- Escape: Clear selection

## Visual Feedback States

### During Selection
- Selected tiles: Highlighted, scaled up, glowing
- Connection path: Cyan tube connecting selected tiles
- Floating word: Follows cursor/finger, shows word and potential score

### On Valid Word Submission
- Toast notification: Green background, "Cleared [WORD]! +[SCORE] points"
- Tiles animate out (scale down, fade out)
- Gravity animation: Remaining tiles fall smoothly
- Combo multiplier increases
- Time increases
- Score updates

### On Invalid Word
- Toast notification: Red background, "[WORD] is not a valid word"
- Selected tiles flash red
- Combo multiplier resets to 1.0
- Selection clears

### Game Over
- Overlay appears with dark backdrop
- Shows final score (large, gradient text)
- Shows best combo and longest word
- Buttons: "Home" and "Play Again"

## Technical Requirements

### Dictionary Loading
- Load from `/words.txt` (public folder)
- Cache in browser cache API if available
- Filter: 2-8 letters, A-Z only, no special characters
- Convert to uppercase Set for O(1) lookup
- Fallback to curated list if loading fails

### Performance
- Smooth 60fps rendering
- Efficient tile lookup (raycasting for mouse/touch position)
- Optimized dictionary lookup (Set-based)
- RequestAnimationFrame for game loop

### Responsive Design
- Mobile-first approach
- Touch-friendly (minimum 44px touch targets)
- Canvas scales appropriately
- Stats overlay doesn't obstruct gameplay
- Timer bar compact on mobile

## Game Loop
1. Update timer (decrease by delta time)
2. Check combo decay (if 5+ seconds since last word, decay combo)
3. Update row timer (decrease by delta time)
4. If row timer ≤ 0:
   - Add new row (shift all down, add at top)
   - Reset row timer with new interval
5. Update visual scene (tile positions, animations)
6. Render frame
7. Repeat

## Initialization
1. Load dictionary (async, non-blocking)
2. Initialize grid (5 rows of random letters)
3. Set starting values:
   - Score: 0
   - Combo: 1.0
   - Time: 60
   - Level: 1
   - Row timer: 7 seconds
4. Start game loop
5. Show tutorial on first play (stored in localStorage)

## Pause System
- Pause button stops game loop
- Timer stops
- Row timer stops
- User interactions disabled
- Visual indication of paused state
- Resume continues from paused state


