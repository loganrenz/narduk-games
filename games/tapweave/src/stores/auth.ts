import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/game'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref<boolean>(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isGuest = computed(() => !user.value)

  // Actions
  function setUser(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken
    // Store in localStorage for persistence
    localStorage.setItem('tapweave_user', JSON.stringify(userData))
    localStorage.setItem('tapweave_token', authToken)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('tapweave_user')
    localStorage.removeItem('tapweave_token')
  }

  function loadFromStorage() {
    const storedUser = localStorage.getItem('tapweave_user')
    const storedToken = localStorage.getItem('tapweave_token')

    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      } catch (error) {
        console.error('Failed to load auth from storage:', error)
        logout()
      }
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      // TODO: Implement actual API call to Cloudflare Worker
      // For now, simulate login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      setUser(data.user, data.token)

      return { success: true, message: 'Login successful' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed. Please try again.' }
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, displayName?: string): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      // TODO: Implement actual API call to Cloudflare Worker
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()
      setUser(data.user, data.token)

      return { success: true, message: 'Registration successful' }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Registration failed. Please try again.' }
    } finally {
      loading.value = false
    }
  }

  function playAsGuest() {
    user.value = {
      id: 'guest_' + Date.now(),
      email: 'guest@tapweave.local',
      displayName: 'Guest Player'
    }
    token.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    // Computed
    isAuthenticated,
    isGuest,
    // Actions
    setUser,
    logout,
    loadFromStorage,
    login,
    register,
    playAsGuest
  }
})
