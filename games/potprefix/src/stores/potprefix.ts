import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSeed, trie } from '../utils/trie'

const rareLetters = new Set(['Q', 'Z', 'J', 'X'])

export const usePotStore = defineStore('potprefix', () => {
  const bankroll = ref(1000)
  const pot = ref(0)
  const chain = ref<string[]>([])
  const currentWord = ref(getSeed())
  const selectedLetter = ref<string | null>(null)
  const lastBust = ref<string | null>(null)

  const previewWord = computed(() => (selectedLetter.value ? `${selectedLetter.value}${currentWord.value}` : ''))
  const chainLength = computed(() => chain.value.length)
  const previewIsValid = computed(() => (previewWord.value ? trie.has(previewWord.value) : false))

  const multiplier = computed(() => {
    let base = Math.pow(1.2, chainLength.value)
    if (selectedLetter.value && rareLetters.has(selectedLetter.value.toUpperCase())) {
      base *= 1.5
    }
    if (chainLength.value >= 10) {
      base *= 10
    }
    return Number(base.toFixed(2))
  })

  const tryPrefix = (letter: string) => {
    selectedLetter.value = letter.toUpperCase()
    return previewIsValid.value
  }

  const riskAnte = (ante: number) => {
    if (!previewIsValid.value || !selectedLetter.value) return false
    if (ante <= 0 || ante > bankroll.value) return false

    bankroll.value -= ante
    const winnings = Math.round(ante * multiplier.value)
    pot.value += winnings
    currentWord.value = previewWord.value
    chain.value.push(currentWord.value)
    selectedLetter.value = null
    lastBust.value = null
    return true
  }

  const cashOut = () => {
    bankroll.value += pot.value
    pot.value = 0
    chain.value = []
    selectedLetter.value = null
    lastBust.value = null
    currentWord.value = getSeed()
  }

  const bust = () => {
    lastBust.value = previewWord.value || currentWord.value
    pot.value = 0
    chain.value = []
    selectedLetter.value = null
    currentWord.value = getSeed()
  }

  const reset = (seed?: string) => {
    bankroll.value = 1000
    pot.value = 0
    chain.value = []
    selectedLetter.value = null
    lastBust.value = null
    currentWord.value = seed ? seed.toUpperCase() : getSeed()
  }

  return {
    bankroll,
    pot,
    chain,
    currentWord,
    selectedLetter,
    previewWord,
    previewIsValid,
    multiplier,
    lastBust,
    tryPrefix,
    riskAnte,
    cashOut,
    bust,
    reset,
  }
})
