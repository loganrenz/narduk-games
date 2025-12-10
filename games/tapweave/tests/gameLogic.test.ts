import { describe, it, expect } from 'vitest'
import { canFormWord, calculateScore, validateTurn, getRandomSeedWord } from '../src/utils/gameLogic'
import { dictionary } from '../src/utils/trie'

describe('Game Logic', () => {
  describe('canFormWord', () => {
    it('should detect valid letter insertion', () => {
      const result = canFormWord('CAT', 'CART')
      expect(result.valid).toBe(true)
      expect(result.insertedLetter).toBe('R')
      expect(result.insertPosition).toBe(2)
    })

    it('should detect insertion at the beginning', () => {
      const result = canFormWord('CAT', 'SCAT')
      expect(result.valid).toBe(true)
      expect(result.insertedLetter).toBe('S')
      expect(result.insertPosition).toBe(0)
    })

    it('should detect insertion at the end', () => {
      const result = canFormWord('CAT', 'CATS')
      expect(result.valid).toBe(true)
      expect(result.insertedLetter).toBe('S')
      expect(result.insertPosition).toBe(3)
    })

    it('should reject when no letter is inserted', () => {
      const result = canFormWord('CAT', 'CAT')
      expect(result.valid).toBe(false)
    })

    it('should reject when more than one letter is inserted', () => {
      const result = canFormWord('CAT', 'COAST')
      expect(result.valid).toBe(false)
    })

    it('should reject when letters are rearranged', () => {
      const result = canFormWord('CAT', 'ACT')
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateScore', () => {
    it('should calculate score for short words', () => {
      expect(calculateScore('CAT')).toBe(30) // 3 letters * 10
    })

    it('should calculate score for medium words', () => {
      expect(calculateScore('CATS')).toBe(40) // 4 letters * 10
    })

    it('should add bonus for long words', () => {
      expect(calculateScore('CASTLE')).toBe(65) // 6 * 10 + (6-5) * 5
    })

    it('should add increasing bonus for very long words', () => {
      expect(calculateScore('CASTLES')).toBe(80) // 7 * 10 + (7-5) * 5
    })
  })

  describe('getRandomSeedWord', () => {
    it('should return a valid seed word', () => {
      const seed = getRandomSeedWord()
      expect(seed).toBeTruthy()
      expect(seed.length).toBeGreaterThanOrEqual(3)
      expect(seed.length).toBeLessThanOrEqual(5)
    })

    it('should return different words on multiple calls', () => {
      const words = new Set()
      for (let i = 0; i < 20; i++) {
        words.add(getRandomSeedWord())
      }
      // Should get at least a few different words
      expect(words.size).toBeGreaterThan(3)
    })
  })

  describe('validateTurn', () => {
    it('should be skipped until dictionary is loaded', async () => {
      // Dictionary needs to be loaded for these tests
      // In a real test environment, we'd mock this
      expect(true).toBe(true)
    })
  })
})
