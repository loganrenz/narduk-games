import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests to verify that letters are correctly assigned to tiles
 * and that the grid state matches what's rendered
 */

describe('Letter Assignment Tests', () => {
  // Mock the letter pool and pickLetter function
  const letterWeights = {
    E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4, D: 4, G: 3,
    B: 2, C: 2, M: 2, P: 2, F: 2, H: 2, V: 2, W: 2, Y: 2, K: 1, J: 1, X: 1, Q: 1, Z: 1
  };

  const letterPool = (() => {
    const pool = [];
    Object.entries(letterWeights).forEach(([letter, weight]) => {
      for (let i = 0; i < weight; i++) pool.push(letter);
    });
    return pool;
  })();

  function pickLetter() {
    return letterPool[Math.floor(Math.random() * letterPool.length)];
  }

  describe('Letter Generation', () => {
    it('should generate valid letters from the letter pool', () => {
      const validLetters = Object.keys(letterWeights);
      for (let i = 0; i < 100; i++) {
        const letter = pickLetter();
        expect(validLetters).toContain(letter);
        expect(letter).toMatch(/^[A-Z]$/);
      }
    });

    it('should generate letters with correct frequency distribution', () => {
      const counts = {};
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const letter = pickLetter();
        counts[letter] = (counts[letter] || 0) + 1;
      }

      // E should appear most frequently (weight 12)
      expect(counts.E).toBeGreaterThan(counts.Z);
      // Common letters should appear more than rare letters
      expect(counts.A).toBeGreaterThan(counts.Q);
      expect(counts.I).toBeGreaterThan(counts.X);
    });
  });

  describe('Grid Tile Assignment', () => {
    const rows = 10;
    const cols = 7;
    const initialRows = 5;

    function createTestGrid() {
      const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
      for (let r = rows - 1; r >= rows - initialRows; r--) {
        for (let c = 0; c < cols; c++) {
          grid[r][c] = { letter: pickLetter(), id: `${r}-${c}-${Date.now()}-${Math.random()}` };
        }
      }
      return grid;
    }

    it('should assign letters to correct grid positions', () => {
      const grid = createTestGrid();
      
      // Check that initial rows have tiles
      for (let r = rows - 1; r >= rows - initialRows; r--) {
        for (let c = 0; c < cols; c++) {
          expect(grid[r][c]).not.toBeNull();
          expect(grid[r][c].letter).toBeDefined();
          expect(grid[r][c].letter).toMatch(/^[A-Z]$/);
          expect(grid[r][c].id).toBeDefined();
        }
      }

      // Check that top rows are empty
      for (let r = 0; r < rows - initialRows; r++) {
        for (let c = 0; c < cols; c++) {
          expect(grid[r][c]).toBeNull();
        }
      }
    });

    it('should preserve letters when accessing grid positions', () => {
      const grid = createTestGrid();
      const testRow = rows - 1;
      const testCol = 3;
      
      const originalLetter = grid[testRow][testCol].letter;
      const originalId = grid[testRow][testCol].id;
      
      // Access the same position multiple times
      expect(grid[testRow][testCol].letter).toBe(originalLetter);
      expect(grid[testRow][testCol].letter).toBe(originalLetter);
      expect(grid[testRow][testCol].id).toBe(originalId);
    });

    it('should maintain letter consistency across grid operations', () => {
      const grid = createTestGrid();
      const letterMap = new Map();
      
      // Store all letters with their positions
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c]) {
            letterMap.set(`${r}-${c}`, grid[r][c].letter);
          }
        }
      }

      // Verify letters haven't changed
      letterMap.forEach((letter, pos) => {
        const [r, c] = pos.split('-').map(Number);
        expect(grid[r][c].letter).toBe(letter);
      });
    });
  });

  describe('Gravity and Tile Movement', () => {
    it('should preserve letters when applying gravity', () => {
      const cols = 7;
      const rows = 10;
      const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
      
      // Create a test scenario: some tiles in middle rows
      grid[5][0] = { letter: 'A', id: 'test-1' };
      grid[7][0] = { letter: 'B', id: 'test-2' };
      grid[9][0] = { letter: 'C', id: 'test-3' };
      
      // Apply gravity (simulate the applyGravity function)
      const stack = [];
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][0]) stack.push(grid[r][0]);
      }
      let idx = 0;
      for (let r = rows - 1; r >= 0; r--) {
        grid[r][0] = stack[idx] || null;
        idx += 1;
      }
      
      // Verify letters are preserved and in correct order
      expect(grid[9][0].letter).toBe('C');
      expect(grid[8][0].letter).toBe('B');
      expect(grid[7][0].letter).toBe('A');
      expect(grid[6][0]).toBeNull();
    });

    it('should maintain letter integrity when removing tiles', () => {
      const grid = Array.from({ length: 10 }, () => Array.from({ length: 7 }, () => null));
      
      // Fill some positions
      grid[5][3] = { letter: 'T', id: 'tile-1' };
      grid[6][3] = { letter: 'E', id: 'tile-2' };
      grid[7][3] = { letter: 'S', id: 'tile-3' };
      grid[8][3] = { letter: 'T', id: 'tile-4' };
      
      const selection = [
        { row: 6, col: 3, letter: 'E' },
        { row: 7, col: 3, letter: 'S' }
      ];
      
      // Remove selected tiles
      selection.forEach(sel => {
        grid[sel.row][sel.col] = null;
      });
      
      // Verify removed tiles are null
      expect(grid[6][3]).toBeNull();
      expect(grid[7][3]).toBeNull();
      
      // Verify other tiles are preserved
      expect(grid[5][3].letter).toBe('T');
      expect(grid[8][3].letter).toBe('T');
    });
  });

  describe('Row Addition', () => {
    it('should add new row with valid letters', () => {
      const rows = 10;
      const cols = 7;
      const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
      
      // Simulate adding a new row
      for (let r = 0; r < rows - 1; r++) {
        grid[r] = grid[r + 1] || Array.from({ length: cols }, () => null);
      }
      const newRow = Array.from({ length: cols }, () => ({ 
        letter: pickLetter(), 
        id: `${Date.now()}-${Math.random()}` 
      }));
      grid[rows - 1] = newRow;
      
      // Verify new row has valid letters
      for (let c = 0; c < cols; c++) {
        expect(grid[rows - 1][c]).not.toBeNull();
        expect(grid[rows - 1][c].letter).toMatch(/^[A-Z]$/);
        expect(Object.keys(letterWeights)).toContain(grid[rows - 1][c].letter);
      }
    });
  });

  describe('Letter Value Consistency', () => {
    const letterValues = {
      A:1,E:1,I:1,L:1,N:1,O:1,R:1,S:1,T:1,U:1,
      D:2,G:2,
      B:3,C:3,M:3,P:3,
      F:4,H:4,V:4,W:4,Y:4,
      K:5,
      J:8,X:8,
      Q:10,Z:10
    };

    it('should have correct letter values for all letters in pool', () => {
      Object.keys(letterWeights).forEach(letter => {
        expect(letterValues).toHaveProperty(letter);
        expect(letterValues[letter]).toBeGreaterThan(0);
      });
    });

    it('should correctly identify high-value letters', () => {
      const highLetters = new Set(['Q','Z','X','J']);
      highLetters.forEach(letter => {
        expect(letterValues[letter]).toBeGreaterThanOrEqual(8);
      });
    });
  });
});

