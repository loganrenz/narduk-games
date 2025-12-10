<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { usePotStore } from '../stores/potprefix'
import { getSeed } from '../utils/trie'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const store = usePotStore()

const previewState = computed(() => {
  if (!store.previewWord) return 'idle'
  return store.previewIsValid ? 'valid' : 'invalid'
})

const handleLetterClick = (letter: string) => {
  // If clicking the same letter, clear selection
  if (store.selectedLetter === letter) {
    store.clearSelection()
  } else {
    store.tryPrefix(letter)
  }
}

const buildWord = () => {
  if (store.previewIsValid) {
    store.buildWord()
  }
}

const startNewGame = () => {
  store.startGame('endless', getSeed())
}

// Timer for timed mode
let timerInterval: number | null = null

onMounted(() => {
  // Initialize game if not already started
  if (store.chain.length === 0 && !store.currentWord) {
    store.startGame('endless')
  }
  
  if (store.gameMode === 'timed') {
    timerInterval = window.setInterval(() => {
      if (store.timeRemaining > 0) {
        store.timeRemaining = store.timeRemaining - 1
      }
      if (store.timeRemaining <= 0) {
        store.gameOver = true
        if (timerInterval) clearInterval(timerInterval)
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<template>
  <section class="space-y-6">
    <!-- Game Over Modal -->
    <div v-if="store.gameOver" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="bg-casino-table border border-casino-neon rounded-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-3xl font-bold text-center mb-4">Game Over!</h2>
        <div class="space-y-2 text-center mb-6">
          <p class="text-xl">Final Score: <span class="text-casino-neon font-bold">{{ store.score.toLocaleString() }}</span></p>
          <p class="text-sm text-white/60">Chain Length: {{ store.chainLength }}</p>
          <p v-if="store.score >= store.highScore" class="text-casino-neon font-semibold">🎉 New High Score!</p>
        </div>
        <button class="btn btn-primary w-full" @click="startNewGame">Play Again</button>
      </div>
    </div>

    <!-- Score and Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Score</p>
        <p class="text-3xl font-bold text-casino-neon">{{ store.score.toLocaleString() }}</p>
        <p class="text-sm text-white/60">High: {{ store.highScore.toLocaleString() }}</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Chain Length</p>
        <p class="text-3xl font-bold">{{ store.chainLength }}</p>
        <p class="text-sm text-white/60">{{ store.validLetters.length }} valid letters</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Current Word</p>
        <p class="text-2xl font-black tracking-wider">{{ store.currentWord }}</p>
        <button class="btn btn-ghost text-xs mt-2" @click="startNewGame">New Game</button>
      </div>
    </div>

    <!-- Word Chain Display -->
    <div class="grid-card">
      <h3 class="text-lg font-semibold mb-3">Word Chain</h3>
      <div class="flex flex-wrap gap-2 min-h-[60px] items-center">
        <template v-if="store.chain.length > 0">
          <div
            v-for="(word, index) in store.chain"
            :key="`${word}-${index}`"
            class="px-4 py-2 rounded-lg bg-casino-neon/20 border border-casino-neon/50 text-casino-neon font-semibold text-sm"
          >
            {{ word }}
          </div>
          <span class="text-white/40 text-2xl">→</span>
        </template>
        <div
          class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm"
        >
          {{ store.currentWord }}
        </div>
        <div
          v-if="store.previewWord && store.previewIsValid"
          class="px-4 py-2 rounded-lg bg-casino-neon/30 border-2 border-casino-neon text-casino-neon font-bold text-sm animate-pulse"
        >
          {{ store.previewWord }}?
        </div>
        <p v-if="store.chain.length === 0" class="text-white/60">Start building your word chain!</p>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="grid-card" v-if="store.selectedLetter">
      <div class="text-center space-y-2">
        <p class="text-xs uppercase text-white/60">Preview</p>
        <div
          class="text-4xl font-black tracking-wider"
          :class="{
            'text-casino-neon': previewState === 'valid',
            'text-casino-danger': previewState === 'invalid',
          }"
        >
          {{ store.previewWord }}
        </div>
        <p v-if="previewState === 'valid'" class="text-sm text-casino-neon">
          ✓ Valid word! Tap "Build Word" to add it.
        </p>
        <p v-else class="text-sm text-casino-danger">
          ✗ Not a valid word. Try another letter.
        </p>
        <button
          class="btn btn-primary w-full mt-4"
          :disabled="!store.previewIsValid"
          @click="buildWord"
        >
          Build Word
        </button>
        <button class="btn btn-ghost w-full" @click="store.clearSelection">
          Cancel
        </button>
      </div>
    </div>

    <!-- Letter Grid -->
    <div class="grid-card">
      <h3 class="text-lg font-semibold mb-3">Add a Prefix Letter</h3>
      <p class="text-sm text-white/60 mb-4">
        Tap a letter to add it before "{{ store.currentWord }}" to form a new word.
      </p>
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="letter in alphabet"
          :key="letter"
          class="btn uppercase text-lg font-bold transition-all duration-200"
          :class="{
            'bg-casino-neon text-casino-table border-casino-neon': store.selectedLetter === letter && store.previewIsValid,
            'bg-casino-danger/20 text-casino-danger border-casino-danger': store.selectedLetter === letter && !store.previewIsValid,
            'bg-white/5 border-white/10 hover:border-white/30': store.selectedLetter !== letter,
            'border-2 border-casino-neon/50 bg-casino-neon/10': store.validLetters.includes(letter) && !store.selectedLetter,
          }"
          @click="handleLetterClick(letter)"
        >
          {{ letter }}
        </button>
      </div>
      <p class="text-xs text-white/60 mt-3">
        <span class="text-casino-neon">{{ store.validLetters.length }}</span> valid letters available.
        Rare letters (Q, Z, J, X) give bonus points!
      </p>
    </div>

    <!-- Instructions -->
    <div class="grid-card bg-white/5 border-dashed">
      <h3 class="text-lg font-semibold mb-2">How to Play</h3>
      <ol class="space-y-2 text-sm text-white/80 list-decimal list-inside">
        <li>Start with a seed word (shown above)</li>
        <li>Tap a letter to add it as a prefix</li>
        <li>If the preview word is valid (green), tap "Build Word"</li>
        <li>Keep building longer chains for more points!</li>
        <li>Longer words and chains = higher scores</li>
      </ol>
    </div>
  </section>
</template>
