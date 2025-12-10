import { dictionary } from './trie'
import type { TurnData } from '../types/game'

/**
 * Validates if a word can be formed by inserting a single letter into the current word
 */
export function canFormWord(currentWord: string, newWord: string): {
  valid: boolean
  insertedLetter?: string
  insertPosition?: number
} {
  const current = currentWord.toUpperCase()
  const target = newWord.toUpperCase()

  // New word must be exactly 1 letter longer
  if (target.length !== current.length + 1) {
    return { valid: false }
  }

  // Try to find where the letter was inserted
  for (let i = 0; i <= current.length; i++) {
    const testWord = current.slice(0, i) + target[i] + current.slice(i)
    if (testWord === target) {
      return {
        valid: true,
        insertedLetter: target[i],
        insertPosition: i
      }
    }
  }

  return { valid: false }
}

/**
 * Validates a turn: checks if the new word is valid and can be formed from current word
 */
export function validateTurn(currentWord: string, newWord: string): {
  valid: boolean
  error?: string
  turnData?: TurnData
} {
  if (!newWord || newWord.length < 3) {
    return { valid: false, error: 'Word must be at least 3 letters' }
  }

  if (!dictionary.isValidWord(newWord)) {
    return { valid: false, error: 'Not a valid word' }
  }

  const formResult = canFormWord(currentWord, newWord)
  if (!formResult.valid) {
    return { valid: false, error: 'Must insert exactly one letter' }
  }

  const score = calculateScore(newWord)

  return {
    valid: true,
    turnData: {
      word: newWord,
      insertedLetter: formResult.insertedLetter!,
      insertPosition: formResult.insertPosition!,
      score
    }
  }
}

/**
 * Calculate score for a word
 * Base: word length * 10
 * Bonus: +5 for each letter beyond 5
 */
export function calculateScore(word: string): number {
  const baseScore = word.length * 10
  const lengthBonus = Math.max(0, word.length - 5) * 5
  return baseScore + lengthBonus
}

/**
 * Get a random seed word (3-5 letters)
 */
export function getRandomSeedWord(): string {
  const seedWords = [
    'CAT', 'DOG', 'RUN', 'HAT', 'BAT', 'SET', 'BIG', 'HOT', 'CUP', 'PEN',
    'WORD', 'PLAY', 'GAME', 'BIRD', 'FISH', 'BOOK', 'COIN', 'MOON', 'STAR', 'TREE',
    'HOUSE', 'HORSE', 'PLANE', 'TRAIN', 'BEACH', 'MUSIC', 'DANCE', 'SMILE', 'HEART', 'BRAVE'
  ]
  return seedWords[Math.floor(Math.random() * seedWords.length)] || 'CAT'
}

/**
 * Get possible next words (for hints)
 */
export function getPossibleWords(currentWord: string, maxResults: number = 5): string[] {
  const current = currentWord.toUpperCase()
  const possibilities: string[] = []
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  // Try inserting each letter at each position
  for (let pos = 0; pos <= current.length; pos++) {
    for (const letter of alphabet) {
      const newWord = current.slice(0, pos) + letter + current.slice(pos)
      if (dictionary.isValidWord(newWord) && !possibilities.includes(newWord)) {
        possibilities.push(newWord)
        if (possibilities.length >= maxResults) {
          return possibilities
        }
      }
    }
  }

  return possibilities
}

/**
 * Calculate total score for a chain of words
 */
export function calculateChainScore(chain: string[]): number {
  return chain.reduce((total, word) => total + calculateScore(word), 0)
}

/**
 * Check if there are any possible moves from the current word
 */
export function hasValidMoves(currentWord: string): boolean {
  const current = currentWord.toUpperCase()

  // Quick check: try a few common insertions
  for (let pos = 0; pos <= current.length; pos++) {
    for (const letter of 'AEIOULNRST') { // Most common letters first
      const newWord = current.slice(0, pos) + letter + current.slice(pos)
      if (dictionary.isValidWord(newWord)) {
        return true
      }
    }
  }

  return false
}
