import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameMode, GameStatus, TurnData } from '../types/game'
import { validateTurn, getRandomSeedWord } from '../utils/gameLogic'
import { dictionary } from '../utils/trie'

export const useGameStore = defineStore('game', () => {
  // State
  const seedWord = ref<string>('')
  const chain = ref<string[]>([])
  const currentWord = ref<string>('')
  const score = ref<number>(0)
  const lives = ref<number>(3)
  const gameMode = ref<GameMode>('endless')
  const status = ref<GameStatus>('waiting')
  const timeRemaining = ref<number>(0)
  const longestWord = ref<string>('')

  // Computed
  const chainLength = computed(() => chain.value.length)
  const currentChain = computed(() => [seedWord.value, ...chain.value].join(' → '))
  const isPlaying = computed(() => status.value === 'playing')
  const isGameOver = computed(() => status.value === 'ended' || lives.value <= 0)

  // Actions
  function startGame(mode: GameMode, seed?: string) {
    gameMode.value = mode
    seedWord.value = seed || getRandomSeedWord()
    currentWord.value = seedWord.value
    chain.value = []
    score.value = 0
    lives.value = 3
    status.value = 'playing'
    longestWord.value = seedWord.value

    // Set time for timed mode
    if (mode === 'timed') {
      timeRemaining.value = 180 // 3 minutes
    }

    console.log('Game started:', { mode, seedWord: seedWord.value })
  }

  function submitWord(newWord: string): { success: boolean; message: string; turnData?: TurnData } {
    if (!isPlaying.value) {
      return { success: false, message: 'Game is not active' }
    }

    if (!dictionary.isLoaded()) {
      return { success: false, message: 'Dictionary is still loading...' }
    }

    const validation = validateTurn(currentWord.value, newWord)

    if (!validation.valid) {
      lives.value = Math.max(0, lives.value - 1)
      if (lives.value === 0) {
        endGame()
      }
      return { success: false, message: validation.error || 'Invalid word' }
    }

    // Valid word - update game state
    chain.value.push(newWord)
    currentWord.value = newWord
    score.value += validation.turnData!.score

    // Track longest word
    if (newWord.length > longestWord.value.length) {
      longestWord.value = newWord
    }

    return {
      success: true,
      message: `Great! +${validation.turnData!.score} points`,
      turnData: validation.turnData
    }
  }

  function endGame() {
    status.value = 'ended'
    console.log('Game ended:', { score: score.value, chainLength: chainLength.value })
  }

  function pauseGame() {
    if (status.value === 'playing') {
      status.value = 'paused'
    }
  }

  function resumeGame() {
    if (status.value === 'paused') {
      status.value = 'playing'
    }
  }

  function resetGame() {
    seedWord.value = ''
    chain.value = []
    currentWord.value = ''
    score.value = 0
    lives.value = 3
    status.value = 'waiting'
    timeRemaining.value = 0
    longestWord.value = ''
  }

  function updateTime(delta: number) {
    if (gameMode.value === 'timed' && isPlaying.value) {
      timeRemaining.value = Math.max(0, timeRemaining.value - delta)
      if (timeRemaining.value === 0) {
        endGame()
      }
    }
  }

  return {
    // State
    seedWord,
    chain,
    currentWord,
    score,
    lives,
    gameMode,
    status,
    timeRemaining,
    longestWord,
    // Computed
    chainLength,
    currentChain,
    isPlaying,
    isGameOver,
    // Actions
    startGame,
    submitWord,
    endGame,
    pauseGame,
    resumeGame,
    resetGame,
    updateTime
  }
})
