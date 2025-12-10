import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSeed, trie } from '../utils/trie'

export type GameMode = 'endless' | 'challenge' | 'timed'

const rareLetters = new Set(['Q', 'Z', 'J', 'X'])

export const usePotStore = defineStore('potprefix', () => {
  // Game state
  const gameMode = ref<GameMode>('endless')
  const score = ref(0)
  const highScore = ref(0)
  const chain = ref<string[]>([])
  const currentWord = ref(getSeed())
  const selectedLetter = ref<string | null>(null)
  const gameOver = ref(false)
  const timeRemaining = ref(60) // for timed mode
  const targetChainLength = ref(10) // for challenge mode

  // Computed values
  const previewWord = computed(() => (selectedLetter.value ? `${selectedLetter.value}${currentWord.value}` : ''))
  const chainLength = computed(() => chain.value.length)
  const previewIsValid = computed(() => (previewWord.value ? trie.has(previewWord.value) : false))
  
  // Get valid letters for current word
  const validLetters = computed(() => {
    const letters: string[] = []
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      if (trie.has(`${letter}${currentWord.value}`)) {
        letters.push(letter)
      }
    }
    return letters
  })

  // Calculate points for a word
  const getWordPoints = (word: string, position: number) => {
    let points = word.length * 10 // Base points for word length
    points += position * 5 // Bonus for chain position
    
    // Rare letter bonus
    for (const letter of word) {
      if (rareLetters.has(letter.toUpperCase())) {
        points += 20
      }
    }
    
    // Chain length bonus
    if (chainLength.value >= 5) points *= 1.5
    if (chainLength.value >= 10) points *= 2
    if (chainLength.value >= 15) points *= 3
    
    return Math.round(points)
  }

  // Try selecting a letter (just preview, doesn't commit)
  const tryPrefix = (letter: string) => {
    selectedLetter.value = letter.toUpperCase()
    return previewIsValid.value
  }

  // Commit the selected letter and build the word
  const buildWord = () => {
    if (!previewIsValid.value || !selectedLetter.value) return false
    
    const newWord = previewWord.value
    const points = getWordPoints(newWord, chainLength.value)
    
    currentWord.value = newWord
    chain.value.push(newWord)
    score.value += points
    
    // Update high score
    if (score.value > highScore.value) {
      highScore.value = score.value
    }
    
    selectedLetter.value = null
    
    // Check win conditions
    if (gameMode.value === 'challenge' && chainLength.value >= targetChainLength.value) {
      gameOver.value = true
    }
    
    return true
  }

  // Start a new game
  const startGame = (mode: GameMode = 'endless', seed?: string) => {
    gameMode.value = mode
    score.value = 0
    chain.value = []
    currentWord.value = seed ? seed.toUpperCase() : getSeed()
    selectedLetter.value = null
    gameOver.value = false
    timeRemaining.value = 60
    
    if (mode === 'timed') {
      // Start timer (would need to be implemented with setInterval in component)
    }
  }

  // Reset to initial state
  const reset = (seed?: string) => {
    startGame('endless', seed)
  }

  // Clear selection without building
  const clearSelection = () => {
    selectedLetter.value = null
  }

  return {
    // State
    gameMode,
    score,
    highScore,
    chain,
    currentWord,
    selectedLetter,
    gameOver,
    timeRemaining,
    targetChainLength,
    // Computed
    previewWord,
    chainLength,
    previewIsValid,
    validLetters,
    // Methods
    tryPrefix,
    buildWord,
    startGame,
    reset,
    clearSelection,
    getWordPoints,
  }
})
