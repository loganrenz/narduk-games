<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePotStore } from '../stores/potprefix'
import { getSeed, trie } from '../utils/trie'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const anteOptions = [10, 50, 100]
const store = usePotStore()
const ante = ref(10)

const previewState = computed(() => {
  if (!store.previewWord) return 'idle'
  return store.previewIsValid ? 'valid' : 'invalid'
})

const hintLetters = computed(() =>
  alphabet.filter((letter) => trie.has(`${letter}${store.currentWord}`)).slice(0, 3)
)

const handleAnte = (value: number) => {
  if (value === -1) {
    ante.value = store.bankroll
  } else {
    ante.value = value
  }
}

const risk = () => {
  if (store.previewIsValid) {
    store.riskAnte(ante.value)
  }
}

const cashOut = () => {
  store.cashOut()
}

const bust = () => {
  store.bust()
}

const newSeed = () => {
  store.reset(getSeed())
}
</script>

<template>
  <section class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Bankroll</p>
        <p class="text-3xl font-bold">{{ store.bankroll.toLocaleString() }} chips</p>
        <p class="text-sm text-white/60">Wins add to bank; antes reduce it.</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Current Pot</p>
        <p class="text-3xl font-bold text-casino-neon">{{ store.pot.toLocaleString() }}</p>
        <p class="text-sm text-white/60">Bust resets the pot. Cash out anytime.</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Chain</p>
        <p class="text-3xl font-bold">{{ store.chain.length }}</p>
        <p class="text-sm text-white/60">Multiplier: x{{ store.multiplier.toFixed(2) }}</p>
      </div>
    </div>

    <div class="grid-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="uppercase text-xs text-white/60">Current word</p>
          <h2 class="text-3xl font-black tracking-wider">_{{ store.currentWord }}</h2>
        </div>
        <button class="btn btn-ghost" @click="newSeed">New seed</button>
      </div>
      <div class="text-lg" :class="{ 'text-casino-neon': previewState === 'valid', 'text-casino-danger': previewState === 'invalid' }">
        <span class="uppercase tracking-widest">{{ store.previewWord || 'Tap a letter to preview' }}</span>
      </div>
      <p class="text-sm text-white/60">Hint letters: <span class="text-casino-neon">{{ hintLetters.join(', ') || '—' }}</span></p>
    </div>

    <div class="grid-card">
      <h3 class="text-lg font-semibold">Alphabet</h3>
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="letter in alphabet"
          :key="letter"
          class="btn btn-ghost uppercase"
          :class="{
            'border-casino-neon text-casino-neon bg-white/5': store.selectedLetter === letter,
            'border-casino-danger text-casino-danger': store.selectedLetter === letter && !store.previewIsValid,
          }"
          @click="store.tryPrefix(letter)"
        >
          {{ letter }}
        </button>
      </div>
    </div>

    <div class="grid-card">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Ante &amp; risk</h3>
        <p class="text-sm text-white/60">Preview must be valid to risk.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in anteOptions"
          :key="option"
          class="btn btn-ghost"
          :class="{ 'border-casino-neon text-casino-neon': ante === option }"
          @click="handleAnte(option)"
        >
          {{ option }}
        </button>
        <button class="btn btn-ghost" :class="{ 'border-casino-neon text-casino-neon': ante === store.bankroll }" @click="handleAnte(-1)">
          All-in
        </button>
        <span class="text-sm text-white/60">Selected ante: {{ ante }}</span>
      </div>
      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary" :disabled="!store.previewIsValid" @click="risk">Risk It</button>
        <button class="btn btn-ghost" :disabled="store.pot === 0" @click="cashOut">Cash Out</button>
        <button class="btn btn-ghost" @click="bust">Bust (simulate fail)</button>
      </div>
      <p class="text-xs text-white/60">Winnings = ante × chain multiplier. Rare letters (Q/Z/J/X) boost by x1.5. Chain 10+ adds jackpot x10.</p>
    </div>

    <div class="grid-card">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Chain history</h3>
        <span v-if="store.lastBust" class="text-sm text-casino-danger">Busted on {{ store.lastBust }}</span>
      </div>
      <ul class="flex gap-2 flex-wrap text-sm">
        <li v-for="word in store.chain" :key="word" class="px-3 py-1 rounded-full bg-white/10 border border-white/5">
          {{ word }}
        </li>
        <li v-if="!store.chain.length" class="text-white/60">Play a letter to start the chain.</li>
      </ul>
    </div>
  </section>
</template>
