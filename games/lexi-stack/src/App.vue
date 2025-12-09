<template>
  <div class="app">
    <header>
      <div class="brand">LexiStack <span class="badge">v2</span></div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">Score</span>
          <span class="stat-value">{{ score.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Combo</span>
          <span class="stat-value combo">x{{ combo.toFixed(1) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Time</span>
          <span class="stat-value" :class="timeLeft < 10 ? 'time-low' : 'time-positive'">{{ timeLeft.toFixed(1) }}s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Next Row</span>
          <span class="stat-value">{{ rowTimer.toFixed(1) }}s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Level</span>
          <span class="stat-value level">{{ level }}</span>
        </div>
      </div>
      <div class="controls">
        <button @click="pauseGame">{{ paused ? 'Resume' : 'Pause' }}</button>
        <button @click="resetGame">Restart</button>
      </div>
    </header>

    <div class="board-wrap">
      <div class="board" ref="boardRef">
        <svg class="path-layer" ref="pathLayerRef"></svg>
        <div class="grid" ref="gridRef"></div>
      </div>
      <button 
        v-if="canTriggerEarlyRow"
        @click="triggerEarlyRow"
        class="early-row-btn"
        :class="{ 'pulsing': canTriggerEarlyRow }"
      >
        Add Row Early<br>
        <span class="bonus-preview">+{{ earlyRowBonusPoints }} pts</span>
      </button>
    </div>

    <div class="floating-word" :class="{ show: showFloatingWord }" :style="floatingWordStyle">
      <div class="word">{{ selectionWord }}</div>
      <div class="points">{{ floatingPoints }}</div>
    </div>

    <div class="toast-area">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </div>

    <div class="overlay" v-if="showTutorial">
      <div class="modal">
        <h2>How to Play</h2>
        <ul>
          <li>Drag across adjacent tiles (including diagonals) to build a word.</li>
          <li>Release after 2+ letters to auto-submit.</li>
          <li>Valid words score points, add time, and raise your combo.</li>
          <li>New letter rows spawn from the bottom—keep the tower from reaching the top.</li>
          <li>Pause anytime; resume to continue the climb.</li>
        </ul>
        <div class="modal-actions">
          <button class="primary" @click="startGame">Play</button>
        </div>
      </div>
    </div>

    <div class="overlay" v-if="showGameOver">
      <div class="modal gameover">
        <h1>Game Over</h1>
        <div class="summary">
          <div class="card">Score<br><span>{{ score.toLocaleString() }}</span></div>
          <div class="card">Best Combo<br><span>x{{ bestCombo.toFixed(1) }}</span></div>
          <div class="card">Longest Word<br><span>{{ longestWord || '-' }}</span></div>
        </div>
        <div class="modal-actions">
          <button @click="showGameOver = false; showTutorial = true">Home</button>
          <button class="primary" @click="resetGame">Play Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'

const rows = 10
const cols = 8
const initialRows = 5

const letterWeights = {
  E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4, D: 4, G: 3,
  B: 2, C: 2, M: 2, P: 2, F: 2, H: 2, V: 2, W: 2, Y: 2, K: 1, J: 1, X: 1, Q: 1, Z: 1
}

const letterValues = {
  A:1,E:1,I:1,L:1,N:1,O:1,R:1,S:1,T:1,U:1,D:2,G:2,B:3,C:3,M:3,P:3,
  F:4,H:4,V:4,W:4,Y:4,K:5,J:8,X:8,Q:10,Z:10
}

const highLetters = new Set(['Q','Z','X','J'])
const fallbackWords = ['STACK','WORD','GAME','CODE','DRAG','MOVE','TIME','PAUSE','LEVEL','POINT','GRID','ROWS','TILE','RAISE','QUIZ','JAZZ']

const boardRef = ref(null)
const gridRef = ref(null)
const pathLayerRef = ref(null)

const score = ref(0)
const combo = ref(1.0)
const bestCombo = ref(1.0)
const longestWord = ref('')
const timeLeft = ref(60)
const rowTimer = ref(7)
const level = ref(1)
const paused = ref(false)
const showTutorial = ref(false)
const showGameOver = ref(false)
const showFloatingWord = ref(false)
const floatingWordStyle = ref({ left: '0px', top: '0px' })
const selectionWord = ref('')
const floatingPoints = ref('')
const toasts = ref([])

let dictionary = new Set(fallbackWords)
let grid = []
let selection = []
let running = false
let lastTime = null
let rowInterval = 7
let rowsAdded = 0
let dragging = false
let pointerId = null
let tileRenderers = new Map()
let lastWordAt = 0
let decayBuffer = 0
let animationFrameId = null
let isAnimatingInvalid = false

const letterPool = (() => {
  const pool = []
  Object.entries(letterWeights).forEach(([letter, weight]) => {
    for (let i = 0; i < weight; i++) pool.push(letter)
  })
  return pool
})()

function pickLetter() {
  return letterPool[Math.floor(Math.random() * letterPool.length)]
}

function resetGrid() {
  grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
  for (let r = rows - 1; r >= rows - initialRows; r--) {
    for (let c = 0; c < cols; c++) {
      grid[r][c] = { letter: pickLetter(), id: `${r}-${c}-${Date.now()}-${Math.random()}` }
    }
  }
}

function createThreeJSText(letter, isHigh, isSelected, container) {
  const rect = container.getBoundingClientRect()
  const width = rect.width || 100
  const height = rect.height || 100
  
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000)
  camera.position.z = 100
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.left = '0'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.pointerEvents = 'none'
  
  const textCanvas = document.createElement('canvas')
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2)
  const canvasSize = 1024 * pixelRatio
  textCanvas.width = canvasSize
  textCanvas.height = canvasSize
  const ctx = textCanvas.getContext('2d')
  
  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.textRenderingOptimization = 'optimizeQuality'
  
  ctx.fillStyle = isHigh ? '#fb923c' : '#e2e8f0'
  const fontSize = 720 * pixelRatio
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
  
  if (isSelected) {
    mesh.position.z = 5
    mesh.scale.set(1.1, 1.1, 1)
  }
  
  function animate() {
    renderer.render(scene, camera)
  }
  animate()
  
  container.appendChild(renderer.domElement)
  
  return { scene, camera, renderer, mesh, animate }
}

function renderTileWithThreeJS(tileDiv, letter, isHigh, isSelected) {
  const existingCanvas = tileDiv.querySelector('canvas')
  if (existingCanvas) {
    existingCanvas.remove()
  }
  
  const tileId = `${tileDiv.dataset.row}-${tileDiv.dataset.col}`
  if (tileRenderers.has(tileId)) {
    const old = tileRenderers.get(tileId)
    if (old.renderer && old.renderer.domElement) {
      old.renderer.domElement.remove()
      old.renderer.dispose()
    }
    tileRenderers.delete(tileId)
  }
  
  const renderData = createThreeJSText(letter, isHigh, isSelected, tileDiv)
  tileRenderers.set(tileId, renderData)
}

function renderGrid() {
  if (!gridRef.value) return
  gridRef.value.innerHTML = ''
  tileRenderers.clear()
  gridRef.value.style.setProperty('--rows', rows)
  gridRef.value.style.setProperty('--cols', cols)
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div')
      cell.className = 'cell'
      cell.dataset.row = r
      cell.dataset.col = c
      const tile = grid[r][c]
      if (tile) {
        const div = document.createElement('div')
        div.className = 'tile'
        div.dataset.row = r
        div.dataset.col = c
        const isHigh = highLetters.has(tile.letter)
        const isSelected = selection.some(s => s.row === r && s.col === c)
        if (isHigh) div.classList.add('high')
        if (isSelected) div.classList.add('selected')
        cell.appendChild(div)
        nextTick(() => {
          renderTileWithThreeJS(div, tile.letter, isHigh, isSelected)
        })
      }
      gridRef.value.appendChild(cell)
    }
  }
  drawPath()
}

function drawPath() {
  if (!pathLayerRef.value || !gridRef.value) return
  pathLayerRef.value.setAttribute('viewBox', `0 0 ${pathLayerRef.value.clientWidth} ${pathLayerRef.value.clientHeight}`)
  if (selection.length < 2) {
    pathLayerRef.value.innerHTML = ''
    return
  }
  const pts = selection.map(sel => {
    const cell = gridRef.value.querySelector(`.cell[data-row="${sel.row}"][data-col="${sel.col}"]`)
    if (!cell) return null
    const rect = cell.getBoundingClientRect()
    const parent = gridRef.value.getBoundingClientRect()
    return { x: rect.left + rect.width / 2 - parent.left, y: rect.top + rect.height / 2 - parent.top }
  }).filter(Boolean)
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  poly.setAttribute('fill', 'none')
  poly.setAttribute('stroke', '#22d3ee')
  poly.setAttribute('stroke-width', '6')
  poly.setAttribute('stroke-linecap', 'round')
  poly.setAttribute('stroke-linejoin', 'round')
  poly.setAttribute('opacity', '0.75')
  poly.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '))
  pathLayerRef.value.innerHTML = ''
  pathLayerRef.value.appendChild(poly)
}

function addToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }, 2200)
}

function handleSelection(row, col) {
  const tile = grid[row][col]
  if (!tile) return
  if (!dragging) return
  const already = selection.find(s => s.row === row && s.col === col)
  if (already) return
  if (selection.length) {
    const last = selection[selection.length - 1]
    const rDiff = Math.abs(last.row - row)
    const cDiff = Math.abs(last.col - col)
    if (rDiff > 1 || cDiff > 1) return
  }
  selection.push({ row, col, letter: tile.letter })
  updateFloatingWord()
  renderGrid()
}

function getSelectionWord() {
  return selection.map(s => s.letter).join('')
}

function wordScore(word) {
  const letters = word.split('')
  const sum = letters.reduce((acc, ch) => acc + (letterValues[ch] || 0), 0)
  const lengthBonus = 1 + word.length * 0.1
  return Math.round(sum * lengthBonus * combo.value)
}

function validateWord(word) {
  if (word.length < 2 || word.length > 8) return false
  if (!/^[A-Z]+$/.test(word)) return false
  return dictionary.has(word)
}

function submitSelection() {
  const word = getSelectionWord()
  showFloatingWord.value = false
  if (word.length < 2) {
    clearSelection()
    return
  }
  if (!validateWord(word)) {
    combo.value = 1.0
    flashSelection()
    addToast(`${word} is not a valid word`, 'error')
    return
  }
  const gained = wordScore(word)
  score.value += gained
  longestWord.value = word.length > longestWord.value.length ? word : longestWord.value
  addToast(`Cleared ${word}! +${gained} pts`, 'success')
  combo.value = Math.min(5, combo.value + 0.1)
  bestCombo.value = Math.max(bestCombo.value, combo.value)
  lastWordAt = performance.now()
  decayBuffer = 0
  const timeBonus = Math.min(3, 1 + Math.floor(word.length / 3))
  timeLeft.value += timeBonus
  removeTiles()
  applyGravity()
  clearSelection()
  rowInterval = Math.max(3, rowInterval - 0.05)
}

function flashSelection() {
  // Prevent multiple animations from interfering
  if (isAnimatingInvalid) return
  isAnimatingInvalid = true
  
  // Capture selection coordinates - keep selection during animation
  const selectionCopy = [...selection]
  
  // Add invalid class to all selected tiles
  selectionCopy.forEach(sel => {
    const tileEl = gridRef.value?.querySelector(`.cell[data-row="${sel.row}"][data-col="${sel.col}"] .tile`)
    if (tileEl) {
      tileEl.classList.add('invalid')
    }
  })
  
  // After animation completes, remove invalid class, clear selection, and re-render
  setTimeout(() => {
    // Remove invalid class from tiles
    selectionCopy.forEach(sel => {
      const tileEl = gridRef.value?.querySelector(`.cell[data-row="${sel.row}"][data-col="${sel.col}"] .tile`)
      if (tileEl) {
        tileEl.classList.remove('invalid')
      }
    })
    // Clear selection and re-render grid
    isAnimatingInvalid = false
    clearSelection()
  }, 300)
}

function removeTiles() {
  selection.forEach(sel => {
    grid[sel.row][sel.col] = null
  })
}

function applyGravity() {
  for (let c = 0; c < cols; c++) {
    const stack = []
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c])
    }
    let idx = 0
    for (let r = rows - 1; r >= 0; r--) {
      grid[r][c] = stack[idx] || null
      idx += 1
    }
  }
}

function clearSelection(skipRender = false) {
  selection = []
  if (!skipRender) {
    renderGrid()
  }
}

function updateFloatingWord() {
  const word = getSelectionWord()
  selectionWord.value = word
  if (word.length >= 2) {
    floatingPoints.value = `+${wordScore(word)} pts`
  } else {
    floatingPoints.value = 'Need 2+ letters'
  }
}

function addRow(isEarly = false) {
  const topHasTiles = grid[0].some(Boolean)
  if (topHasTiles) {
    endGame()
    return
  }
  
  let scoreBonus = 0
  let timeBonus = 0
  
  if (isEarly) {
    const remainingTime = rowTimer.value
    scoreBonus = Math.round(remainingTime * 10)
    timeBonus = Math.min(5, Math.round(remainingTime * 0.5))
    
    score.value += scoreBonus
    timeLeft.value += timeBonus
    
    addToast(`Early row! +${scoreBonus} pts, +${timeBonus.toFixed(1)}s`, 'success')
  }
  
  for (let r = 0; r < rows - 1; r++) {
    grid[r] = grid[r + 1]
  }
  const newRow = Array.from({ length: cols }, () => ({ letter: pickLetter(), id: `${Date.now()}-${Math.random()}` }))
  grid[rows - 1] = newRow
  rowTimer.value = rowInterval
  rowsAdded += 1
  level.value = 1 + Math.floor(rowsAdded / 3)
  renderGrid()
}

function decayCombo(delta) {
  const now = performance.now()
  if (now - lastWordAt < 5000) return
  decayBuffer += delta
  while (decayBuffer >= 1 && combo.value > 1) {
    combo.value = Math.max(1, parseFloat((combo.value - 0.1).toFixed(1)))
    decayBuffer -= 1
  }
}

function endGame() {
  running = false
  paused.value = false
  showGameOver.value = true
}

function gameLoop(timestamp) {
  if (!running) return
  if (!lastTime) lastTime = timestamp
  const delta = (timestamp - lastTime) / 1000
  lastTime = timestamp
  if (!paused.value) {
    timeLeft.value -= delta
    rowTimer.value -= delta
    decayCombo(delta)
    if (rowTimer.value <= 0) addRow()
    if (timeLeft.value <= 0) {
      timeLeft.value = 0
      endGame()
      return
    }
  }
  animationFrameId = requestAnimationFrame(gameLoop)
}

function loadDictionary() {
  return fetch('/words.txt')
    .then(r => r.text())
    .then(text => {
      const words = text.split(/\r?\n/).map(w => w.trim()).filter(Boolean)
      dictionary = new Set(words)
    })
    .catch(() => {
      dictionary = new Set(fallbackWords)
    })
}

function startGame() {
  showTutorial.value = false
  showGameOver.value = false
  running = true
  paused.value = false
  lastTime = null
  timeLeft.value = 60
  rowInterval = 7
  rowTimer.value = 7
  score.value = 0
  combo.value = 1.0
  bestCombo.value = 1.0
  longestWord.value = ''
  lastWordAt = performance.now()
  decayBuffer = 0
  level.value = 1
  rowsAdded = 0
  selection = []
  resetGrid()
  renderGrid()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function pauseGame() {
  if (!running) return
  paused.value = !paused.value
}

function resetGame() {
  startGame()
}

const canTriggerEarlyRow = computed(() => {
  return running && !paused.value && rowTimer.value > 1.5
})

const earlyRowBonusPoints = computed(() => {
  if (!canTriggerEarlyRow.value) return 0
  return Math.round(rowTimer.value * 10)
})

function triggerEarlyRow() {
  if (!canTriggerEarlyRow.value) return
  if (rowTimer.value <= 1.5) return
  addRow(true)
}

function attachEvents() {
  if (!gridRef.value) return
  
  gridRef.value.addEventListener('pointerdown', e => {
    const cell = e.target.closest('.cell')
    if (!cell || !running || paused.value) return
    const row = Number(cell.dataset.row)
    const col = Number(cell.dataset.col)
    if (!grid[row][col]) return
    dragging = true
    pointerId = e.pointerId
    selection = [{ row, col, letter: grid[row][col].letter }]
    updateFloatingWord()
    renderGrid()
    showFloatingWord.value = true
    floatingWordStyle.value = { left: `${e.clientX}px`, top: `${e.clientY - 20}px` }
  })

  window.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pointerId) return
    floatingWordStyle.value = { left: `${e.clientX}px`, top: `${e.clientY - 20}px` }
    const target = document.elementFromPoint(e.clientX, e.clientY)
    const cell = target && target.closest('.cell')
    if (!cell) return
    const row = Number(cell.dataset.row)
    const col = Number(cell.dataset.col)
    handleSelection(row, col)
  })

  window.addEventListener('pointerup', e => {
    if (!dragging || e.pointerId !== pointerId) return
    dragging = false
    pointerId = null
    submitSelection()
  })

  window.addEventListener('resize', drawPath)
}

onMounted(() => {
  if (!localStorage.getItem('lexistack_tutorial_seen')) {
    showTutorial.value = true
  } else {
    startGame()
  }
  attachEvents()
  loadDictionary()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

