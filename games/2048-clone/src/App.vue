<template>
  <div class="app">
    <header>
      <div class="brand">2048</div>
      <div class="header-actions">
        <button @click="showStats = true">Stats</button>
        <button @click="showHelp = true">Help</button>
        <button @click="newGame">New Game</button>
      </div>
    </header>

    <div class="game-container">
      <div class="score-container">
        <div class="score-box">
          <div class="score-label">Score</div>
          <div class="score-value">{{ score }}</div>
        </div>
        <div class="score-box">
          <div class="score-label">Best</div>
          <div class="score-value">{{ bestScore }}</div>
        </div>
      </div>

      <div class="game-board" ref="gameBoard">
        <div
          v-for="(row, rowIndex) in board"
          :key="rowIndex"
          class="row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="cell"
            :class="{
              [`tile-${cell}`]: cell !== 0,
              'tile-new': cell === newTile?.value && rowIndex === newTile?.row && colIndex === newTile?.col,
              'tile-merged': cell === mergedTile?.value && rowIndex === mergedTile?.row && colIndex === mergedTile?.col
            }"
          >
            <span v-if="cell !== 0" class="tile-value">{{ cell }}</span>
          </div>
        </div>
      </div>

      <div class="game-message" v-if="gameWon || gameOver">
        <div class="message-content">
          <h2 v-if="gameWon">🎉 You Win!</h2>
          <h2 v-else>Game Over!</h2>
          <p v-if="gameWon">You reached 2048!</p>
          <p v-else>No more moves available</p>
          <div class="message-actions">
            <button @click="newGame">Try Again</button>
            <button v-if="gameWon" class="primary" @click="continueGame">Keep Going</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelp" class="overlay" @click.self="showHelp = false">
      <div class="modal">
        <h2>How to Play</h2>
        <div class="instructions">
          <p><strong>Join the tiles, get to 2048!</strong></p>
          <ul>
            <li>Use <strong>arrow keys</strong> or <strong>swipe</strong> to move tiles</li>
            <li>When two tiles with the same number touch, they <strong>merge into one</strong></li>
            <li>After each move, a new tile (2 or 4) appears</li>
            <li>Try to create a tile with the number <strong>2048</strong> to win!</li>
            <li>Game ends when the board is full and no moves are possible</li>
          </ul>
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
            <div class="stat-value">{{ bestScore }}</div>
            <div class="stat-label">Best Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ gamesPlayed }}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ gamesWon }}</div>
            <div class="stat-label">Games Won</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ winRate }}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showStats = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-area">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { saveToLocalStorage, loadFromLocalStorage } from '../../../shared/utils/storage.js'

const GRID_SIZE = 4
const board = ref(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)))
const score = ref(0)
const bestScore = ref(0)
const gameWon = ref(false)
const gameOver = ref(false)
const showHelp = ref(false)
const showStats = ref(false)
const toasts = ref([])
const newTile = ref(null)
const mergedTile = ref(null)
const gameBoard = ref(null)

// Statistics
const gamesPlayed = ref(0)
const gamesWon = ref(0)

const winRate = computed(() => {
  if (gamesPlayed.value === 0) return 0
  return Math.round((gamesWon.value / gamesPlayed.value) * 100)
})

// Touch controls
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

function loadBestScore() {
  const saved = loadFromLocalStorage('2048_best_score')
  if (saved) {
    bestScore.value = saved
  }
}

function saveBestScore() {
  saveToLocalStorage('2048_best_score', bestScore.value)
}

function loadStats() {
  const saved = loadFromLocalStorage('2048_stats')
  if (saved) {
    gamesPlayed.value = saved.gamesPlayed || 0
    gamesWon.value = saved.gamesWon || 0
  }
}

function saveStats() {
  saveToLocalStorage('2048_stats', {
    gamesPlayed: gamesPlayed.value,
    gamesWon: gamesWon.value
  })
}

function loadGameState() {
  const saved = loadFromLocalStorage('2048_game_state')
  if (saved && saved.board) {
    board.value = saved.board
    score.value = saved.score || 0
    gameWon.value = saved.gameWon || false
    gameOver.value = saved.gameOver || false
  } else {
    newGame()
  }
}

function saveGameState() {
  saveToLocalStorage('2048_game_state', {
    board: board.value,
    score: score.value,
    gameWon: gameWon.value,
    gameOver: gameOver.value
  })
}

function addRandomTile() {
  const emptyCells = []
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board.value[i][j] === 0) {
        emptyCells.push({ row: i, col: j })
      }
    }
  }

  if (emptyCells.length === 0) return false

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  board.value[randomCell.row][randomCell.col] = value
  
  newTile.value = { row: randomCell.row, col: randomCell.col, value }
  setTimeout(() => {
    newTile.value = null
  }, 300)

  return true
}

function moveLeft() {
  let moved = false
  mergedTile.value = null

  for (let i = 0; i < GRID_SIZE; i++) {
    const originalRow = [...board.value[i]]
    const row = board.value[i].filter(val => val !== 0)
    const newRow = []

    for (let j = 0; j < row.length; j++) {
      if (j < row.length - 1 && row[j] === row[j + 1]) {
        const mergedValue = row[j] * 2
        newRow.push(mergedValue)
        score.value += mergedValue
        mergedTile.value = { row: i, col: newRow.length - 1, value: mergedValue }
        setTimeout(() => {
          mergedTile.value = null
        }, 300)
        j++
        moved = true
      } else {
        newRow.push(row[j])
      }
    }

    while (newRow.length < GRID_SIZE) {
      newRow.push(0)
    }

    // Check if row actually changed
    if (!moved) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (originalRow[j] !== newRow[j]) {
          moved = true
          break
        }
      }
    }

    board.value[i] = newRow
  }

  return moved
}

function moveRight() {
  let moved = false
  mergedTile.value = null

  for (let i = 0; i < GRID_SIZE; i++) {
    const originalRow = [...board.value[i]]
    const row = board.value[i].filter(val => val !== 0)
    const newRow = []

    for (let j = row.length - 1; j >= 0; j--) {
      if (j > 0 && row[j] === row[j - 1]) {
        const mergedValue = row[j] * 2
        newRow.unshift(mergedValue)
        score.value += mergedValue
        mergedTile.value = { row: i, col: GRID_SIZE - newRow.length, value: mergedValue }
        setTimeout(() => {
          mergedTile.value = null
        }, 300)
        j--
        moved = true
      } else {
        newRow.unshift(row[j])
      }
    }

    while (newRow.length < GRID_SIZE) {
      newRow.unshift(0)
    }

    // Check if row actually changed
    if (!moved) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (originalRow[j] !== newRow[j]) {
          moved = true
          break
        }
      }
    }

    board.value[i] = newRow
  }

  return moved
}

function moveUp() {
  let moved = false
  mergedTile.value = null

  for (let j = 0; j < GRID_SIZE; j++) {
    const originalColumn = []
    for (let i = 0; i < GRID_SIZE; i++) {
      originalColumn.push(board.value[i][j])
    }

    const column = []
    for (let i = 0; i < GRID_SIZE; i++) {
      if (board.value[i][j] !== 0) {
        column.push(board.value[i][j])
      }
    }

    const newColumn = []
    for (let i = 0; i < column.length; i++) {
      if (i < column.length - 1 && column[i] === column[i + 1]) {
        const mergedValue = column[i] * 2
        newColumn.push(mergedValue)
        score.value += mergedValue
        mergedTile.value = { row: newColumn.length - 1, col: j, value: mergedValue }
        setTimeout(() => {
          mergedTile.value = null
        }, 300)
        i++
        moved = true
      } else {
        newColumn.push(column[i])
      }
    }

    while (newColumn.length < GRID_SIZE) {
      newColumn.push(0)
    }

    // Check if column actually changed
    if (!moved) {
      for (let i = 0; i < GRID_SIZE; i++) {
        if (originalColumn[i] !== newColumn[i]) {
          moved = true
          break
        }
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      board.value[i][j] = newColumn[i]
    }
  }

  return moved
}

function moveDown() {
  let moved = false
  mergedTile.value = null

  for (let j = 0; j < GRID_SIZE; j++) {
    const originalColumn = []
    for (let i = 0; i < GRID_SIZE; i++) {
      originalColumn.push(board.value[i][j])
    }

    const column = []
    for (let i = 0; i < GRID_SIZE; i++) {
      if (board.value[i][j] !== 0) {
        column.push(board.value[i][j])
      }
    }

    const newColumn = []
    for (let i = column.length - 1; i >= 0; i--) {
      if (i > 0 && column[i] === column[i - 1]) {
        const mergedValue = column[i] * 2
        newColumn.unshift(mergedValue)
        score.value += mergedValue
        mergedTile.value = { row: GRID_SIZE - newColumn.length, col: j, value: mergedValue }
        setTimeout(() => {
          mergedTile.value = null
        }, 300)
        i--
        moved = true
      } else {
        newColumn.unshift(column[i])
      }
    }

    while (newColumn.length < GRID_SIZE) {
      newColumn.unshift(0)
    }

    // Check if column actually changed
    if (!moved) {
      for (let i = 0; i < GRID_SIZE; i++) {
        if (originalColumn[i] !== newColumn[i]) {
          moved = true
          break
        }
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      board.value[i][j] = newColumn[i]
    }
  }

  return moved
}

function canMove() {
  // Check for empty cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board.value[i][j] === 0) {
        return true
      }
    }
  }

  // Check for possible merges
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = board.value[i][j]
      if (
        (i < GRID_SIZE - 1 && board.value[i + 1][j] === current) ||
        (j < GRID_SIZE - 1 && board.value[i][j + 1] === current)
      ) {
        return true
      }
    }
  }

  return false
}

function checkWin() {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board.value[i][j] === 2048 && !gameWon.value) {
        gameWon.value = true
        gamesWon.value++
        saveStats()
        addToast('Congratulations! You reached 2048!', 'success')
      }
    }
  }
}

function checkGameOver() {
  if (!canMove()) {
    gameOver.value = true
    gamesPlayed.value++
    saveStats()
    addToast('Game Over!', 'error')
  }
}

function handleMove(direction) {
  if (gameOver.value) return

  let moved = false
  switch (direction) {
    case 'left':
      moved = moveLeft()
      break
    case 'right':
      moved = moveRight()
      break
    case 'up':
      moved = moveUp()
      break
    case 'down':
      moved = moveDown()
      break
  }

  if (moved) {
    addRandomTile()
    checkWin()
    checkGameOver()
    
    if (score.value > bestScore.value) {
      bestScore.value = score.value
      saveBestScore()
    }
    
    saveGameState()
  }
}

function newGame() {
  board.value = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  score.value = 0
  gameWon.value = false
  gameOver.value = false
  newTile.value = null
  mergedTile.value = null
  addRandomTile()
  addRandomTile()
  gamesPlayed.value++
  saveStats()
  saveGameState()
}

function continueGame() {
  gameWon.value = false
}

function handleKeyDown(e) {
  if (gameOver.value && !gameWon.value) return

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      handleMove('left')
      break
    case 'ArrowRight':
      e.preventDefault()
      handleMove('right')
      break
    case 'ArrowUp':
      e.preventDefault()
      handleMove('up')
      break
    case 'ArrowDown':
      e.preventDefault()
      handleMove('down')
      break
  }
}

// Touch controls
function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function handleTouchEnd(e) {
  if (!touchStartX || !touchStartY) return

  touchEndX = e.changedTouches[0].clientX
  touchEndY = e.changedTouches[0].clientY

  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const minSwipeDistance = 30

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        handleMove('right')
      } else {
        handleMove('left')
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        handleMove('down')
      } else {
        handleMove('up')
      }
    }
  }

  touchStartX = 0
  touchStartY = 0
}

function addToast(message, type = 'info') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }, 3000)
}

onMounted(() => {
  loadBestScore()
  loadStats()
  loadGameState()
  
  window.addEventListener('keydown', handleKeyDown)
  
  if (gameBoard.value) {
    gameBoard.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    gameBoard.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  // Check if first visit - show help
  const hasSeenHelp = loadFromLocalStorage('2048_help_seen')
  if (!hasSeenHelp) {
    showHelp.value = true
    saveToLocalStorage('2048_help_seen', true)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  
  if (gameBoard.value) {
    gameBoard.value.removeEventListener('touchstart', handleTouchStart)
    gameBoard.value.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<style scoped>
/* Styles are in style.css */
</style>

