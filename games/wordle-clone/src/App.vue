<template>
  <div class="app">
    <header>
      <div class="brand">Wordle</div>
      <div class="header-actions">
        <button v-if="currentUser" class="user-badge" @click="showProfile = true">
          {{ currentUser.displayname || currentUser.username }}
        </button>
        <button @click="showStats = true">Stats</button>
        <button @click="showHelp = true">Help</button>
        <button v-if="!currentUser" @click="showLogin = true">Login</button>
      </div>
    </header>

    <div class="game-board">
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
        <div
          v-for="(tile, tileIndex) in row"
          :key="tileIndex"
          class="tile-container"
          :ref="el => setTileRef(el, rowIndex, tileIndex)"
        >
          <div
            class="tile"
            :class="{
              filled: tile.letter,
              correct: tile.state === 'correct',
              present: tile.state === 'present',
              absent: tile.state === 'absent',
              flipping: tile.flipping,
              bounce: tile.bounce
            }"
          >
            <span v-if="tile.letter" class="tile-letter">{{ tile.letter }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="keyboard">
      <div v-for="(row, rowIndex) in keyboardRows" :key="rowIndex" class="keyboard-row">
        <button
          v-for="key in row"
          :key="key"
          class="key"
          :class="{
            wide: key === 'ENTER' || key === 'DELETE',
            correct: keyStates[key] === 'correct',
            present: keyStates[key] === 'present',
            absent: keyStates[key] === 'absent'
          }"
          @click="handleKeyPress(key)"
        >
          {{ key === 'DELETE' ? '⌫' : key }}
        </button>
      </div>
    </div>

    <div class="toast-area">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelp" class="overlay" @click.self="showHelp = false">
      <div class="modal">
        <h2>How to Play</h2>
        <div class="instructions">
          <p><strong>Guess the WORDLE in 6 tries.</strong></p>
          <p>Each guess must be a valid five-letter word. Hit the enter button to submit.</p>
          <p>After each guess, the color of the tiles will change to show how close your guess was to the word.</p>
          
          <div class="instruction-examples">
            <div class="example-row">
              <div class="example-tile correct-example">W</div>
              <p><strong>W</strong> is in the word and in the correct spot.</p>
            </div>
            <div class="example-row">
              <div class="example-tile present-example">I</div>
              <p><strong>I</strong> is in the word but in the wrong spot.</p>
            </div>
            <div class="example-row">
              <div class="example-tile absent-example">U</div>
              <p><strong>U</strong> is not in the word in any spot.</p>
            </div>
          </div>
          
          <p style="margin-top: 16px;"><strong>Examples:</strong></p>
          <div class="example-word">
            <div class="example-tile correct-example">W</div>
            <div class="example-tile absent-example">E</div>
            <div class="example-tile absent-example">A</div>
            <div class="example-tile absent-example">R</div>
            <div class="example-tile absent-example">Y</div>
          </div>
          <p class="example-note">The letter <strong>W</strong> is in the word and in the correct spot.</p>
          
          <div class="example-word">
            <div class="example-tile absent-example">P</div>
            <div class="example-tile present-example">I</div>
            <div class="example-tile absent-example">L</div>
            <div class="example-tile absent-example">L</div>
            <div class="example-tile absent-example">S</div>
          </div>
          <p class="example-note">The letter <strong>I</strong> is in the word but in the wrong spot.</p>
          
          <div class="example-word">
            <div class="example-tile absent-example">V</div>
            <div class="example-tile absent-example">A</div>
            <div class="example-tile absent-example">G</div>
            <div class="example-tile absent-example">U</div>
            <div class="example-tile absent-example">E</div>
          </div>
          <p class="example-note">The letter <strong>U</strong> is not in the word in any spot.</p>
        </div>
        <div class="modal-actions">
          <button class="primary" @click="showHelp = false">Got it!</button>
        </div>
      </div>
    </div>

    <!-- Stats Modal -->
    <div v-if="showStats" class="overlay" @click.self="showStats = false">
      <div class="modal">
        <h2>Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.gamesPlayed }}</div>
            <div class="stat-label">Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ winRate }}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.currentStreak }}</div>
            <div class="stat-label">Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.maxStreak }}</div>
            <div class="stat-label">Max Streak</div>
          </div>
        </div>
        <div v-if="gameWon || gameLost" class="share-result">
          <div style="margin-bottom: 8px; font-weight: 700;">Share Result:</div>
          <div style="word-break: break-all; font-family: monospace; font-size: 0.75rem;">
            {{ shareText }}
          </div>
          <button
            class="primary"
            style="margin-top: 12px; width: 100%;"
            @click="copyShareText"
          >
            Copy
          </button>
        </div>
        <div class="modal-actions">
          <button @click="showStats = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameWon || gameLost" class="overlay" @click.self="closeGameOver">
      <div class="modal">
        <h2>{{ gameWon ? '🎉 You Won!' : '😔 Game Over' }}</h2>
        <p v-if="gameWon">
          Congratulations! You guessed the word in {{ currentRow + 1 }} {{ currentRow === 0 ? 'try' : 'tries' }}!
        </p>
        <p v-else>
          The word was: <strong style="color: var(--correct);">{{ targetWord }}</strong>
        </p>
        <div class="share-result" style="margin-top: 16px;">
          <div style="margin-bottom: 8px; font-weight: 700;">Share Result:</div>
          <div style="word-break: break-all; font-family: monospace; font-size: 0.75rem;">
            {{ shareText }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeGameOver">Close</button>
          <button class="primary" @click="newGame">New Game</button>
        </div>
      </div>
    </div>

    <!-- Login/Signup Modal -->
    <div v-if="showLogin" class="overlay" @click.self="showLogin = false">
      <div class="modal">
        <h2>{{ loginMode === 'login' ? 'Login' : 'Sign Up' }}</h2>
        <div class="auth-form">
          <div class="form-group">
            <label>Username</label>
            <input 
              v-model="loginUsername" 
              type="text" 
              placeholder="Enter username"
              @keyup.enter="loginMode === 'login' ? handleLogin() : handleSignup()"
            />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input 
              v-model="loginPassword" 
              type="password" 
              placeholder="Enter password"
              @keyup.enter="loginMode === 'login' ? handleLogin() : handleSignup()"
            />
          </div>
          <div v-if="loginMode === 'signup'" class="form-group">
            <label>Confirm Password</label>
            <input 
              v-model="loginConfirmPassword" 
              type="password" 
              placeholder="Confirm password"
              @keyup.enter="handleSignup()"
            />
          </div>
          <div v-if="loginError" class="error-message">{{ loginError }}</div>
          <div class="modal-actions">
            <button @click="loginMode = loginMode === 'login' ? 'signup' : 'login'">
              {{ loginMode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login' }}
            </button>
            <button class="primary" @click="loginMode === 'login' ? handleLogin() : handleSignup()">
              {{ loginMode === 'login' ? 'Login' : 'Sign Up' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <div v-if="showProfile" class="overlay" @click.self="showProfile = false">
      <div class="modal">
        <h2>Profile</h2>
        <div class="profile-info">
          <p><strong>Username:</strong> {{ currentUser?.username }}</p>
          <p><strong>Display Name:</strong> {{ currentUser?.displayname || currentUser?.username }}</p>
        </div>
        <div class="modal-actions">
          <button @click="handleLogout">Logout</button>
          <button @click="showProfile = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { saveToLocalStorage, loadFromLocalStorage } from '../../../shared/utils/storage.js'
import { getOrCreateUser, login, getUser } from '../../../shared/auth/client.js'
import { setAuthCookie, getAuthCookie, clearAuthCookie } from '../../../shared/auth/cookies.js'

const ROWS = 6
const COLS = 5

// Game state - initialize with empty board
const board = ref(Array(ROWS).fill(null).map(() => 
  Array(COLS).fill(null).map(() => ({ 
    letter: '', 
    state: null, 
    flipping: false, 
    bounce: false 
  }))
))
const currentRow = ref(0)
const currentCol = ref(0)
const targetWord = ref('')
const gameWon = ref(false)
const gameLost = ref(false)
const showHelp = ref(false)
const showStats = ref(false)
const showLogin = ref(false)
const showProfile = ref(false)
const currentUser = ref(null)
const loginMode = ref('login') // 'login' or 'signup'
const loginUsername = ref('')
const loginPassword = ref('')
const loginConfirmPassword = ref('')
const loginError = ref('')
const toasts = ref([])
const tileRefs = ref({})
const canvasRefs = ref({})
const keyStates = ref({})

// Statistics
const stats = ref({
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayed: null
})

const winRate = computed(() => {
  if (stats.value.gamesPlayed === 0) return 0
  return Math.round((stats.value.gamesWon / stats.value.gamesPlayed) * 100)
})

// Word list (5-letter words)
const validWords = ref(new Set())
const wordList = ref([])

// Keyboard layout
const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
]

// Three.js renderers for tiles
const tileRenderers = ref({})

const shareText = computed(() => {
  if (!gameWon.value && !gameLost.value) return ''
  
  // Calculate the number of rows used
  const rowsUsed = gameWon.value ? currentRow.value + 1 : (gameLost.value ? ROWS : currentRow.value + 1)
  const lines = [`Wordle ${getDayNumber()} ${rowsUsed}/6`]
  
  board.value.slice(0, rowsUsed).forEach(row => {
    const line = row.map(tile => {
      if (tile.state === 'correct') return '🟩'
      if (tile.state === 'present') return '🟨'
      if (tile.state === 'absent') return '⬜'
      return '⬜'
    }).join('')
    lines.push(line)
  })
  
  return lines.join('\n')
})

function setTileRef(el, row, col) {
  if (el) {
    tileRefs.value[`${row}-${col}`] = el
  }
}

function setCanvasRef(el, row, col) {
  if (el) {
    canvasRefs.value[`${row}-${col}`] = el
  }
}

function getDayNumber() {
  const start = new Date(2024, 0, 1)
  const today = new Date()
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return diff
}

function getDailyWord() {
  if (!wordList.value || wordList.value.length === 0) {
    // Fallback if word list not loaded yet
    const fallback = ['APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GLASS', 'HEART', 'IMAGE', 'JAZZY']
    const dayNumber = getDayNumber()
    return fallback[dayNumber % fallback.length]
  }
  const dayNumber = getDayNumber()
  const index = dayNumber % wordList.value.length
  return wordList.value[index].toUpperCase()
}

async function loadWordList() {
  try {
    // Load dictionary.json (same as lexi-stack)
    const response = await fetch('/dictionary.json')
    if (response.ok) {
      const dict = await response.json()
      // Filter for 5-letter words and convert to uppercase
      const words = Object.keys(dict)
        .filter(w => w.length === 5 && /^[a-z]+$/.test(w))
        .map(w => w.toUpperCase())
      wordList.value = words
      validWords.value = new Set(words)
      console.log(`Loaded ${words.length} five-letter words from dictionary.json`)
      return
    }
  } catch (e) {
    console.warn('Could not load dictionary.json, trying fallback', e)
  }
  
  // Fallback word list
  const fallback = [
    'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GLASS', 'HEART', 'IMAGE', 'JAZZY',
    'KNIFE', 'LEMON', 'MAGIC', 'NIGHT', 'OCEAN', 'PIANO', 'QUICK', 'RIVER', 'SMILE', 'TIGER',
    'UNITY', 'VALUE', 'WATER', 'XENON', 'YOUTH', 'ZEBRA', 'BRAVE', 'CLOUD', 'DREAM', 'EAGLE',
    'FROST', 'GRACE', 'HAPPY', 'IVORY', 'JUMBO', 'KNEEL', 'LIGHT', 'MUSIC', 'NOBLE', 'OLIVE',
    'PEACE', 'QUART', 'RADIO', 'STORM', 'TRUTH', 'ULTRA', 'VIVID', 'WHEAT', 'YACHT', 'ZILCH',
    'PARSE', 'WORDS', 'GAMES', 'STACK', 'LEARN', 'TEACH', 'WRITE', 'READY', 'HELLO', 'WORLD'
  ]
  wordList.value = fallback
  validWords.value = new Set(fallback)
  console.warn('Using fallback word list')
}

function loadStats() {
  const saved = loadFromLocalStorage('wordle_stats')
  if (saved) {
    stats.value = { ...stats.value, ...saved }
  }
}

function saveStats() {
  saveToLocalStorage('wordle_stats', stats.value)
}

function loadGameState() {
  const saved = loadFromLocalStorage('wordle_game')
  const today = getDayNumber()
  
  // Always clear if it's not today's game
  if (saved && saved.day !== today) {
    localStorage.removeItem('wordle_game')
    return false
  }
  
  if (saved && saved.day === today && saved.targetWord) {
    // Validate saved state
    if (saved.board && Array.isArray(saved.board) && saved.board.length === ROWS) {
      // Deep clone to ensure reactivity
      board.value = saved.board.map(row => 
        row.map(tile => ({ ...tile }))
      )
      currentRow.value = saved.currentRow || 0
      currentCol.value = saved.currentCol || 0
      targetWord.value = saved.targetWord
      gameWon.value = saved.gameWon || false
      gameLost.value = saved.gameLost || false
      keyStates.value = saved.keyStates || {}
      return true
    } else {
      // Invalid board structure, clear it
      localStorage.removeItem('wordle_game')
    }
  }
  return false
}

function saveGameState() {
  saveToLocalStorage('wordle_game', {
    day: getDayNumber(),
    board: board.value,
    currentRow: currentRow.value,
    currentCol: currentCol.value,
    targetWord: targetWord.value,
    gameWon: gameWon.value,
    gameLost: gameLost.value,
    keyStates: keyStates.value
  })
}

function createThreeJSText(letter, state, container) {
  const rect = container.getBoundingClientRect()
  const width = rect.width || 62
  const height = rect.height || 62
  
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000)
  camera.position.z = 100
  
  const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true, 
    canvas: container,
    preserveDrawingBuffer: true
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000, 0) // Fully transparent background
  
  const textCanvas = document.createElement('canvas')
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2)
  const canvasSize = 256 * pixelRatio
  textCanvas.width = canvasSize
  textCanvas.height = canvasSize
  const ctx = textCanvas.getContext('2d')
  
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Color based on state - use white text for colored backgrounds (light theme)
  let color = '#1a1a1a' // Dark text for default
  if (state === 'correct' || state === 'present' || state === 'absent') {
    color = '#ffffff' // White text on colored backgrounds
  }
  
  ctx.fillStyle = color
  const fontSize = 180 * pixelRatio
  ctx.font = `bold ${fontSize}px 'Inter', system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, canvasSize / 2, canvasSize / 2)
  
  const texture = new THREE.CanvasTexture(textCanvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  
  const geometry = new THREE.PlaneGeometry(width * 0.8, height * 0.8)
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  function animate() {
    renderer.render(scene, camera)
  }
  animate()
  
  return { scene, camera, renderer, mesh, animate }
}

function renderTile(row, col) {
  // For now, we'll use regular text instead of Three.js to ensure tile colors show properly
  // Three.js can be re-enabled later if needed for special effects
  // The tile colors are handled by CSS classes
}

function animateTileFlip(row, col, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Create new object to ensure reactivity
      board.value[row][col] = {
        ...board.value[row][col],
        flipping: true
      }
      
      // Force Vue update
      nextTick().then(() => {
        setTimeout(() => {
          board.value[row][col] = {
            ...board.value[row][col],
            flipping: false
          }
          nextTick().then(() => resolve())
        }, 600)
      })
    }, delay)
  })
}

function checkGuess(guess) {
  const result = Array(COLS).fill(null)
  const target = targetWord.value.split('')
  const guessLetters = guess.split('')
  const used = Array(COLS).fill(false)
  
  // First pass: mark correct positions
  for (let i = 0; i < COLS; i++) {
    if (guessLetters[i] === target[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < COLS; i++) {
    if (result[i] === 'correct') continue
    
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && guessLetters[i] === target[j]) {
        result[i] = 'present'
        used[j] = true
        break
      }
    }
    
    if (!result[i]) {
      result[i] = 'absent'
    }
  }
  
  return result
}

async function submitGuess() {
  const rowIndex = currentRow.value
  const row = board.value[rowIndex]
  const guess = row.map(t => t.letter).join('')
  
  if (guess.length !== COLS) {
    addToast('Not enough letters', 'error')
    return
  }
  
  if (!validWords.value.has(guess)) {
    addToast('Not a valid word', 'error')
    // Bounce animation
    for (let i = 0; i < COLS; i++) {
      board.value[rowIndex][i] = {
        ...board.value[rowIndex][i],
        bounce: true
      }
      setTimeout(() => {
        board.value[rowIndex][i] = {
          ...board.value[rowIndex][i],
          bounce: false
        }
      }, 300)
    }
    return
  }
  
  // Check the guess
  const results = checkGuess(guess)
  
  // Animate tile flips
  for (let i = 0; i < COLS; i++) {
    const letter = row[i].letter // Get letter before updating state
    
    // Set state first (before animation) - use Vue's reactive update
    const newTile = {
      letter: board.value[rowIndex][i].letter,
      state: results[i],
      flipping: false,
      bounce: false
    }
    board.value[rowIndex][i] = newTile
    
    // Force Vue to update
    await nextTick()
    
    // Animate the flip
    await animateTileFlip(rowIndex, i, i * 100)
    
    // Update key state
    const currentState = keyStates.value[letter]
    if (!currentState || 
        (currentState === 'absent' && results[i] !== 'absent') ||
        (currentState === 'present' && results[i] === 'correct')) {
      keyStates.value[letter] = results[i]
    }
  }
  
  // Check win/loss - do this after animations complete
  if (results.every(r => r === 'correct')) {
    gameWon.value = true
    // Don't increment currentRow if won - keep it at the winning row
    stats.value.gamesWon++
    stats.value.currentStreak++
    stats.value.maxStreak = Math.max(stats.value.maxStreak, stats.value.currentStreak)
    addToast('Congratulations!', 'success')
  } else if (rowIndex === ROWS - 1) {
    gameLost.value = true
    stats.value.currentStreak = 0
    addToast(`The word was: ${targetWord.value}`, 'error')
  } else {
    currentRow.value = rowIndex + 1
    currentCol.value = 0
  }
  
  stats.value.gamesPlayed++
  stats.value.lastPlayed = getDayNumber()
  saveStats()
  saveGameState()
}

function handleKeyPress(key) {
  if (gameWon.value || gameLost.value) return
  
  if (key === 'ENTER') {
    submitGuess()
  } else if (key === 'DELETE') {
    // Clear the current position first
    if (currentCol.value < COLS && board.value[currentRow.value][currentCol.value].letter) {
      // Create new object to ensure reactivity
      board.value[currentRow.value][currentCol.value] = {
        ...board.value[currentRow.value][currentCol.value],
        letter: ''
      }
    } else if (currentCol.value > 0) {
      // If current position is empty, move back and clear the previous position
      currentCol.value--
      board.value[currentRow.value][currentCol.value] = {
        ...board.value[currentRow.value][currentCol.value],
        letter: ''
      }
    }
  } else {
    if (currentCol.value < COLS) {
      // Create new object to ensure reactivity
      board.value[currentRow.value][currentCol.value] = {
        ...board.value[currentRow.value][currentCol.value],
        letter: key
      }
      if (currentCol.value < COLS - 1) {
        currentCol.value++
      }
    }
  }
  
  saveGameState()
}

function handleKeyboardInput(e) {
  if (gameWon.value || gameLost.value) return
  
  const key = e.key.toUpperCase()
  
  if (key === 'ENTER') {
    e.preventDefault()
    submitGuess()
  } else if (key === 'BACKSPACE' || key === 'DELETE') {
    e.preventDefault()
    handleKeyPress('DELETE')
  } else if (/^[A-Z]$/.test(key)) {
    e.preventDefault()
    handleKeyPress(key)
  }
}

function addToast(message, type = 'info') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }, 3000)
}

function copyShareText() {
  navigator.clipboard.writeText(shareText.value).then(() => {
    addToast('Copied to clipboard!', 'success')
  })
}

function newGame() {
  gameWon.value = false
  gameLost.value = false
  currentRow.value = 0
  currentCol.value = 0
  // Create fresh board with proper reactivity
  board.value = Array(ROWS).fill(null).map(() => 
    Array(COLS).fill(null).map(() => ({ 
      letter: '', 
      state: null, 
      flipping: false, 
      bounce: false 
    }))
  )
  keyStates.value = {}
  targetWord.value = getDailyWord()
  // Clear old saved state
  localStorage.removeItem('wordle_game')
  saveGameState()
}

function closeGameOver() {
  gameWon.value = false
  gameLost.value = false
}

async function handleLogin() {
  loginError.value = ''
  
  if (!loginUsername.value || !loginPassword.value) {
    loginError.value = 'Please enter username and password'
    return
  }

  try {
    const user = await login(loginUsername.value, loginPassword.value)
    if (user) {
      currentUser.value = user
      setAuthCookie(user)
      showLogin.value = false
      loginUsername.value = ''
      loginPassword.value = ''
      addToast('Logged in successfully!', 'success')
    } else {
      loginError.value = 'Invalid username or password'
    }
  } catch (error) {
    loginError.value = error.message || 'Login failed'
  }
}

async function handleSignup() {
  loginError.value = ''
  
  if (!loginUsername.value || !loginPassword.value) {
    loginError.value = 'Please enter username and password'
    return
  }

  if (loginPassword.value !== loginConfirmPassword.value) {
    loginError.value = 'Passwords do not match'
    return
  }

  if (loginPassword.value.length < 4) {
    loginError.value = 'Password must be at least 4 characters'
    return
  }

  try {
    // Create user with password
    const user = await getOrCreateUser(loginUsername.value, null, loginPassword.value)
    if (user && user.id) {
      // User created, try to login
      const loggedInUser = await login(loginUsername.value, loginPassword.value)
      if (loggedInUser) {
        currentUser.value = loggedInUser
        setAuthCookie(loggedInUser)
        showLogin.value = false
        loginUsername.value = ''
        loginPassword.value = ''
        loginConfirmPassword.value = ''
        addToast('Account created and logged in!', 'success')
      } else {
        // User created but login failed - might need to set password separately
        currentUser.value = user
        setAuthCookie(user)
        showLogin.value = false
        loginUsername.value = ''
        loginPassword.value = ''
        loginConfirmPassword.value = ''
        addToast('Account created!', 'success')
      }
    } else {
      loginError.value = 'Failed to create account. Username may already be taken.'
    }
  } catch (error) {
    // Show specific error messages
    if (error.message.includes('already taken') || error.message.includes('Username')) {
      loginError.value = 'Username already taken. Please choose another.'
    } else if (error.message.includes('connect') || error.message.includes('network')) {
      loginError.value = 'Unable to connect to server. Please check your connection.'
    } else {
      loginError.value = error.message || 'Signup failed. Please try again.'
    }
  }
}

function handleLogout() {
  currentUser.value = null
  clearAuthCookie()
  showProfile.value = false
  addToast('Logged out', 'info')
}

async function checkAuth() {
  // Check for existing auth cookie (cross-subdomain SSO)
  const cookieUser = getAuthCookie()
  if (cookieUser) {
    // Verify user still exists in auth system
    const user = await getUser(null, cookieUser.id)
    if (user) {
      currentUser.value = user
      // Refresh cookie
      setAuthCookie(user)
    } else {
      // User doesn't exist, clear cookie
      clearAuthCookie()
    }
  }
}

onMounted(async () => {
  // Check for existing auth (cross-subdomain SSO)
  await checkAuth()
  
  await loadWordList()
  loadStats()
  
  // Initialize target word after word list is loaded
  targetWord.value = getDailyWord()
  
  // Check if this is first visit - show help
  const hasSeenHelp = loadFromLocalStorage('wordle_help_seen')
  if (!hasSeenHelp) {
    showHelp.value = true
    saveToLocalStorage('wordle_help_seen', true)
  }
  
  // Try to load saved game state for today
  const hasSavedState = loadGameState()
  
  if (!hasSavedState) {
    // Fresh game - ensure board is empty with proper reactivity
    board.value = Array(ROWS).fill(null).map(() => 
      Array(COLS).fill(null).map(() => ({ 
        letter: '', 
        state: null, 
        flipping: false, 
        bounce: false 
      }))
    )
    currentRow.value = 0
    currentCol.value = 0
    gameWon.value = false
    gameLost.value = false
    keyStates.value = {}
    saveGameState()
  } else {
    // If we loaded saved state, make sure target word is set
    if (!targetWord.value) {
      targetWord.value = getDailyWord()
    }
    // Validate the loaded state - if game is won/lost, don't allow further play
    // But if it's a new day, reset
    const saved = loadFromLocalStorage('wordle_game')
    if (saved && saved.day !== getDayNumber()) {
      // It's a new day, reset
      newGame()
    }
  }
  
  // No need to render tiles - CSS handles the colors
  
  window.addEventListener('keydown', handleKeyboardInput)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardInput)
  
  // Clean up Three.js resources
  Object.values(tileRenderers.value).forEach(renderer => {
    if (renderer.renderer) renderer.renderer.dispose()
    if (renderer.mesh) {
      renderer.mesh.geometry.dispose()
      renderer.mesh.material.dispose()
    }
  })
})
</script>

<style scoped>
.tile-canvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>

