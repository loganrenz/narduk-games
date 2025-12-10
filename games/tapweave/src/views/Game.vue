<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { getPossibleWords } from '../utils/gameLogic'

const emit = defineEmits<{
  goHome: []
}>()

const gameStore = useGameStore()
const currentInput = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const showHint = ref(false)
const hints = ref<string[]>([])
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const insertPosition = ref<number | null>(null)

let messageTimeout: number | undefined

const displayWord = computed(() => {
  const word = gameStore.currentWord.toUpperCase()
  if (insertPosition.value !== null && currentInput.value) {
    return word.slice(0, insertPosition.value) + 
           `[${currentInput.value}]` + 
           word.slice(insertPosition.value)
  }
  return word
})

const timeFormatted = computed(() => {
  const mins = Math.floor(gameStore.timeRemaining / 60)
  const secs = Math.floor(gameStore.timeRemaining % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function insertLetter(letter: string) {
  if (!gameStore.isPlaying) return
  
  currentInput.value = letter
  // Default to end of word
  if (insertPosition.value === null) {
    insertPosition.value = gameStore.currentWord.length
  }
}

function selectPosition(pos: number) {
  insertPosition.value = pos
}

function submitWord() {
  if (!currentInput.value || insertPosition.value === null) {
    showMessage('Select a position and letter first', 'error')
    return
  }

  const currentWord = gameStore.currentWord.toUpperCase()
  const newWord = currentWord.slice(0, insertPosition.value) + 
                  currentInput.value + 
                  currentWord.slice(insertPosition.value)

  const result = gameStore.submitWord(newWord)
  
  if (result.success) {
    showMessage(result.message, 'success')
    currentInput.value = ''
    insertPosition.value = null
  } else {
    showMessage(result.message, 'error')
  }
}

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  
  if (messageTimeout) {
    clearTimeout(messageTimeout)
  }
  
  messageTimeout = setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 3000)
}

function getHints() {
  hints.value = getPossibleWords(gameStore.currentWord, 5)
  showHint.value = true
}

function useHint(word: string) {
  // Find the inserted letter and position
  const current = gameStore.currentWord.toUpperCase()
  const target = word.toUpperCase()
  
  for (let i = 0; i <= current.length; i++) {
    const letter = target[i]
    if (letter && current.slice(0, i) + letter + current.slice(i) === target) {
      insertPosition.value = i
      currentInput.value = letter
      showHint.value = false
      break
    }
  }
}

function clearInput() {
  currentInput.value = ''
  insertPosition.value = null
}

function pauseGame() {
  gameStore.pauseGame()
}

function resumeGame() {
  gameStore.resumeGame()
}

function quitGame() {
  gameStore.resetGame()
  emit('goHome')
}

// Timer update
let timerInterval: number | undefined
onMounted(() => {
  if (gameStore.gameMode === 'timed') {
    timerInterval = setInterval(() => {
      gameStore.updateTime(1)
    }, 1000)
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (messageTimeout) {
    clearTimeout(messageTimeout)
  }
})
</script>

<template>
  <div class="flex flex-col h-screen p-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <button
        @click="quitGame"
        class="text-white/70 hover:text-white text-sm underline"
      >
        ← Home
      </button>
      
      <div class="text-white text-center flex-1">
        <div class="text-sm opacity-70">{{ gameStore.gameMode.toUpperCase() }}</div>
        <div class="text-2xl font-bold">Score: {{ gameStore.score }}</div>
      </div>

      <button
        @click="gameStore.isPlaying ? pauseGame() : resumeGame()"
        class="text-white/70 hover:text-white"
      >
        {{ gameStore.isPlaying ? '⏸' : '▶' }}
      </button>
    </div>

    <!-- Timer (for timed mode) -->
    <div v-if="gameStore.gameMode === 'timed'" class="mb-4">
      <div class="bg-white/10 rounded-lg p-3 text-center">
        <div class="text-white text-xl font-mono">
          ⏱️ {{ timeFormatted }}
        </div>
      </div>
    </div>

    <!-- Lives -->
    <div class="mb-4 text-center">
      <div class="text-white text-lg">
        <span v-for="i in gameStore.lives" :key="i">❤️</span>
        <span v-for="i in (3 - gameStore.lives)" :key="'empty' + i">🖤</span>
      </div>
    </div>

    <!-- Current Word Display -->
    <div class="mb-6">
      <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
        <div class="text-center mb-4">
          <div class="text-sm text-white/60 mb-2">Current Word</div>
          <div class="text-4xl font-bold text-white tracking-wider font-mono">
            {{ displayWord }}
          </div>
        </div>
        
        <!-- Position Selector -->
        <div class="flex justify-center gap-1 mb-4">
          <button
            v-for="i in gameStore.currentWord.length + 1"
            :key="i"
            @click="selectPosition(i - 1)"
            :class="[
              'w-8 h-8 rounded border-2 transition-colors',
              insertPosition === i - 1 
                ? 'bg-yellow-400 border-yellow-300' 
                : 'bg-white/20 border-white/30 hover:bg-white/30'
            ]"
          >
            <span class="text-white text-xs">{{ i - 1 }}</span>
          </button>
        </div>

        <!-- Selected Letter Display -->
        <div v-if="currentInput" class="text-center text-white">
          <div class="text-sm opacity-70">Inserting</div>
          <div class="text-3xl font-bold">{{ currentInput }}</div>
        </div>
      </div>
    </div>

    <!-- Alphabet Grid -->
    <div class="mb-6">
      <div class="grid grid-cols-7 gap-2 max-w-lg mx-auto">
        <button
          v-for="letter in alphabet"
          :key="letter"
          @click="insertLetter(letter)"
          :class="[
            'aspect-square rounded-lg font-bold text-lg transition-all transform',
            currentInput === letter
              ? 'bg-yellow-400 text-gray-900 scale-110'
              : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
          ]"
        >
          {{ letter }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 mb-4">
      <button
        @click="submitWord"
        :disabled="!currentInput || insertPosition === null"
        class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all"
      >
        Submit Word
      </button>
      
      <button
        @click="clearInput"
        class="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all"
      >
        Clear
      </button>
      
      <button
        @click="getHints"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all"
      >
        💡 Hint
      </button>
    </div>

    <!-- Message -->
    <div
      v-if="message"
      :class="[
        'text-center py-3 px-6 rounded-lg mb-4 font-semibold',
        messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      ]"
    >
      {{ message }}
    </div>

    <!-- Chain Display -->
    <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm overflow-y-auto flex-1">
      <div class="text-sm text-white/60 mb-2">Word Chain ({{ gameStore.chainLength }} words)</div>
      <div class="text-white space-y-1">
        <div class="font-bold text-green-300">{{ gameStore.seedWord }}</div>
        <div v-for="(word, idx) in gameStore.chain" :key="idx" class="text-sm">
          → {{ word }}
        </div>
      </div>
    </div>

    <!-- Hints Modal -->
    <div v-if="showHint" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="showHint = false">
      <div class="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4 text-gray-900">Possible Words</h3>
        
        <div v-if="hints.length > 0" class="space-y-2">
          <button
            v-for="hint in hints"
            :key="hint"
            @click="useHint(hint)"
            class="w-full text-left bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {{ hint }}
          </button>
        </div>
        
        <div v-else class="text-gray-600 text-center py-4">
          No hints available. Try a different approach!
        </div>

        <button
          @click="showHint = false"
          class="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameStore.isGameOver" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div class="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 max-w-md w-full text-white text-center">
        <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
        
        <div class="space-y-3 mb-6">
          <div class="text-xl">
            Final Score: <span class="font-bold text-yellow-300">{{ gameStore.score }}</span>
          </div>
          <div>
            Chain Length: <span class="font-bold">{{ gameStore.chainLength }} words</span>
          </div>
          <div>
            Longest Word: <span class="font-bold">{{ gameStore.longestWord }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <button
            @click="gameStore.startGame(gameStore.gameMode); gameStore.resetGame(); gameStore.startGame(gameStore.gameMode)"
            class="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            Play Again
          </button>
          
          <button
            @click="quitGame"
            class="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>

    <!-- Pause Modal -->
    <div v-if="gameStore.status === 'paused'" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <h2 class="text-3xl font-bold mb-6 text-gray-900">Game Paused</h2>
        
        <div class="space-y-3">
          <button
            @click="resumeGame"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
          >
            Resume
          </button>
          
          <button
            @click="quitGame"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Quit to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component styles */
</style>
