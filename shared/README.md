# Shared Utilities

This directory contains shared code that can be used across multiple games in the monorepo.

## Structure

```
shared/
├── utils/          # Utility functions
├── components/     # Reusable components
├── styles/         # Shared CSS/styling
└── constants/      # Shared constants
```

## Usage

Import shared utilities in your games:

```javascript
// Example: Import from a game
import { someUtil } from '../../../shared/utils/someUtil.js'
```

## Guidelines

- Keep shared code generic and reusable
- Document all shared utilities
- Add tests for shared functions
- Use TypeScript for better type safety (optional)

## Examples

### Utility Functions

```javascript
// shared/utils/storage.js
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const loadFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};
```

### Constants

```javascript
// shared/constants/colors.js
export const COLORS = {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
};
```

## Adding New Shared Code

1. Create the appropriate subdirectory if it doesn't exist
2. Add your code with clear documentation
3. Export functions/components properly
4. Update this README with usage examples
5. Consider adding tests

## Notes

- Only add code that will be reused by multiple games
- Keep game-specific code in the game's own directory
- Maintain backward compatibility when modifying shared code
