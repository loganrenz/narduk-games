# Build Prompt: LexiStack Word Game

Build a word puzzle game called LexiStack using HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, just a single HTML file with embedded CSS and JavaScript.

## Game Grid
- 8 columns × 10 visible rows
- Start with 5 rows filled with random letters
- Letters weighted: E(12), A(9), I(9), O(8), N(6), R(6), T(6), L(4), S(4), U(4), D(4), G(3), B/C/M/P/F/H/V/W/Y(2), K/J/X/Q/Z(1)

## Tile Selection
- Select adjacent tiles (including diagonals) by dragging (mouse or touch)
- Minimum 2 tiles to form word
- Visual highlight on selected tiles
- Show connection path between selected tiles
- Floating text follows cursor/finger showing current word and potential score

## Word Validation
- Load dictionary from `/words.txt` (one word per line, uppercase)
- Validate words are 2-8 letters, A-Z only
- Store in Set for fast lookup
- Fallback to hardcoded word list if file fails

## Scoring
Letter values: A/E/I/L/N/O/R/S/T/U=1, D/G=2, B/C/M/P=3, F/H/V/W/Y=4, K=5, J/X=8, Q/Z=10
Score = round((sum of letter values × (1 + word_length × 0.1)) × combo_multiplier)
Combo starts at 1.0, increases by 0.1 per valid word (max 5.0), decays by 0.1 every 1 second after 5 seconds of no words

## Time System
- Start with 60 seconds
- Decreases continuously
- Valid words add time: 1 + floor(word_length/3) seconds (max 3)
- Game ends at 0 seconds

## Row Generation
- New row appears every 7 seconds (decreases by 0.05 each time, min 3 seconds)
- All rows shift down, new row at top
- Game ends if top row is full when trying to add row

## Gravity
- When tiles cleared, tiles fall down to fill empty spaces
- Each column collapses independently

## Visual Design
- Dark background (slate colors)
- Canvas 60vh height (min 400px)
- 3D-style tiles (CSS 3D transforms or canvas)
- Selected tiles: cyan highlight, slightly raised
- High-value letters (Q/Z/X/J): orange/gold color
- Timer bar at top: green (>18s), amber (8-18s), red pulsing (<8s)
- Stats overlay top-right: collapsed shows score, expanded shows score/combo/time/level
- Floating word: follows cursor, shows word text and "+X pts"
- Toast notifications: green for success, red for errors

## Interactions
- Mouse: mousedown on tile → mousemove (drag) → mouseup (auto-submit if 2+ tiles)
- Touch: touchstart → touchmove → touchend (auto-submit if 2+ tiles)
- On drag end: if valid word (2+ letters), auto-submit; else clear selection

## Game Loop
- Update timer (decrease by delta)
- Check combo decay (if 5s since last word, decay every 1s)
- Update row timer (decrease by delta)
- If row timer ≤ 0: shift rows down, add new row at top, reset timer
- Update tile animations
- Render frame
- Repeat with requestAnimationFrame

## Game Over
- When time = 0 or top row full
- Show overlay: final score (large), best combo, longest word
- Buttons: Home, Play Again

## Initialization
- Load dictionary async
- Fill 5 rows with random letters
- Start game loop
- Show tutorial modal on first play (localStorage check)

## Pause
- Pause button stops all timers and interactions
- Resume continues

## Files Needed
- `index.html` - Single file with everything
- `words.txt` - Dictionary file (one word per line, uppercase)

Build it. No explanations, no comments beyond code, no links, no help text. Just the game.

