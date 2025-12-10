<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'
import type { GameMode } from '../types/game'

const emit = defineEmits<{
  startGame: []
}>()

const authStore = useAuthStore()
const gameStore = useGameStore()
const showAuthModal = ref(false)
const authMode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const authError = ref('')

function startGame(mode: GameMode) {
  gameStore.startGame(mode)
  emit('startGame')
}

function playAsGuest() {
  authStore.playAsGuest()
  startGame('endless')
}

async function handleAuth() {
  authError.value = ''
  
  if (authMode.value === 'login') {
    const result = await authStore.login(email.value, password.value)
    if (result.success) {
      showAuthModal.value = false
      email.value = ''
      password.value = ''
    } else {
      authError.value = result.message
    }
  } else {
    const result = await authStore.register(email.value, password.value, displayName.value)
    if (result.success) {
      showAuthModal.value = false
      email.value = ''
      password.value = ''
      displayName.value = ''
    } else {
      authError.value = result.message
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <!-- Logo -->
    <div class="text-center mb-12">
      <h1 class="text-6xl font-bold text-white mb-4">
        🔗 TapWeave
      </h1>
      <p class="text-xl text-purple-200">
        Build word chains by inserting letters
      </p>
    </div>

    <!-- User Info -->
    <div class="mb-8">
      <div v-if="authStore.isAuthenticated" class="text-white text-center">
        <p class="text-lg">Welcome, {{ authStore.user?.displayName || authStore.user?.email }}!</p>
        <button 
          @click="authStore.logout()"
          class="mt-2 text-sm text-purple-300 hover:text-purple-100 underline"
        >
          Logout
        </button>
      </div>
      <div v-else-if="authStore.isGuest" class="text-white text-center">
        <p class="text-lg">Playing as Guest</p>
        <button 
          @click="showAuthModal = true"
          class="mt-2 text-sm text-purple-300 hover:text-purple-100 underline"
        >
          Sign in to save progress
        </button>
      </div>
    </div>

    <!-- Game Modes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-8">
      <button
        @click="startGame('endless')"
        class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        <div class="text-2xl mb-2">♾️</div>
        <div class="text-xl">Endless</div>
        <div class="text-sm opacity-80">Build the longest chain</div>
      </button>

      <button
        @click="startGame('timed')"
        class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        <div class="text-2xl mb-2">⏱️</div>
        <div class="text-xl">Timed</div>
        <div class="text-sm opacity-80">Race against the clock</div>
      </button>

      <button
        @click="startGame('zen')"
        class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        <div class="text-2xl mb-2">🧘</div>
        <div class="text-xl">Zen</div>
        <div class="text-sm opacity-80">Unlimited lives, no pressure</div>
      </button>

      <button
        @click="startGame('hotseat')"
        class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        <div class="text-2xl mb-2">👥</div>
        <div class="text-xl">Hot Seat</div>
        <div class="text-sm opacity-80">Pass and play locally</div>
      </button>
    </div>

    <!-- Auth Actions -->
    <div v-if="!authStore.isAuthenticated && !authStore.isGuest" class="space-y-4">
      <button
        @click="playAsGuest"
        class="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-lg transition-all"
      >
        Play as Guest
      </button>
      <button
        @click="showAuthModal = true; authMode = 'login'"
        class="block text-purple-300 hover:text-purple-100 underline"
      >
        Sign in or create account
      </button>
    </div>

    <!-- Auth Modal -->
    <div v-if="showAuthModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="showAuthModal = false">
      <div class="bg-white rounded-xl p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-6 text-gray-900">
          {{ authMode === 'login' ? 'Sign In' : 'Create Account' }}
        </h2>

        <form @submit.prevent="handleAuth" class="space-y-4">
          <div v-if="authMode === 'register'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Your name"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div v-if="authError" class="text-red-600 text-sm">
            {{ authError }}
          </div>

          <button
            type="submit"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account' }}
          </button>
        </form>

        <div class="mt-4 text-center">
          <button
            @click="authMode = authMode === 'login' ? 'register' : 'login'; authError = ''"
            class="text-sm text-purple-600 hover:text-purple-700 underline"
          >
            {{ authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in' }}
          </button>
        </div>

        <button
          @click="showAuthModal = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- How to Play -->
    <div class="mt-12 max-w-2xl text-white/70 text-center text-sm">
      <p class="mb-2">💡 <strong>How to Play:</strong></p>
      <p>Start with a word, then insert one letter at a time to create a new valid word.</p>
      <p>Build the longest chain you can!</p>
    </div>
  </div>
</template>

<style scoped>
/* Component styles */
</style>
