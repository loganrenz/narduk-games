<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { dictionary } from './utils/trie'
import Home from './views/Home.vue'
import Game from './views/Game.vue'

const authStore = useAuthStore()
const currentView = ref<'home' | 'game'>('home')
const dictionaryLoaded = ref(false)

onMounted(async () => {
  authStore.loadFromStorage()
  await dictionary.loadDictionary()
  dictionaryLoaded.value = true
})

function showGame() {
  currentView.value = 'game'
}

function showHome() {
  currentView.value = 'home'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
    <div v-if="!dictionaryLoaded" class="flex items-center justify-center min-h-screen">
      <div class="text-white text-center">
        <div class="text-4xl mb-4">🔤</div>
        <div class="text-xl">Loading dictionary...</div>
      </div>
    </div>
    
    <template v-else>
      <Home v-if="currentView === 'home'" @start-game="showGame" />
      <Game v-else-if="currentView === 'game'" @go-home="showHome" />
    </template>
  </div>
</template>

<style scoped>
/* Add any app-level styles here */
</style>
