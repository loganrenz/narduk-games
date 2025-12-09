<template>
  <div class="app">
    <!-- UI Overlay -->
    <div class="ui-overlay">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Score</span>
          <span class="stat-value">{{ score.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Height</span>
          <span class="stat-value">{{ height }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Combo</span>
          <span class="stat-value combo">x{{ combo.toFixed(1) }}</span>
        </div>
      </div>

      <div class="next-block-preview" v-if="nextBlockType">
        <div class="preview-label">Next:</div>
        <div class="preview-block" :class="`block-${nextBlockType}`"></div>
      </div>

      <div class="controls-hint" v-if="showControlsHint">
        <p>Tap to drop • Swipe to rotate</p>
      </div>
    </div>

    <!-- Three.js Canvas Container -->
    <div ref="canvasContainer" class="canvas-container"></div>

    <!-- Tutorial Overlay -->
    <div v-if="showTutorial" class="overlay" @click="startGame">
      <div class="modal">
        <h2>Stack & Balance</h2>
        <div class="instructions">
          <p><strong>Build the tallest tower!</strong></p>
          <ul>
            <li>📱 <strong>Tap</strong> to drop the block</li>
            <li>↔️ <strong>Swipe left/right</strong> to rotate around Y-axis</li>
            <li>↕️ <strong>Swipe up/down</strong> to rotate around X-axis</li>
            <li>🎯 Place blocks carefully to maintain balance</li>
            <li>⭐ Higher stacks = more points!</li>
          </ul>
          <button class="primary-button" @click="startGame">Start Playing</button>
        </div>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <div v-if="showGameOver" class="overlay">
      <div class="modal gameover">
        <h1>Game Over!</h1>
        <div class="summary">
          <div class="card">
            <div class="card-label">Final Height</div>
            <div class="card-value">{{ height }}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Score</div>
            <div class="card-value">{{ score.toLocaleString() }}</div>
          </div>
          <div class="card">
            <div class="card-label">Best Combo</div>
            <div class="card-value">x{{ bestCombo.toFixed(1) }}</div>
          </div>
          <div class="card">
            <div class="card-label">Blocks Placed</div>
            <div class="card-value">{{ blocksPlaced }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showGameOver = false; showTutorial = true">Home</button>
          <button class="primary-button" @click="resetGame">Play Again</button>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d'

// Game State
const canvasContainer = ref(null)
const score = ref(0)
const height = ref(0)
const combo = ref(1.0)
const bestCombo = ref(1.0)
const blocksPlaced = ref(0)
const showTutorial = ref(false)
const showGameOver = ref(false)
const showControlsHint = ref(true)
const nextBlockType = ref('cube')
const toasts = ref([])

// Three.js & Physics
let scene, camera, renderer, world
let physicsObjects = []
let currentBlock = null
let currentBlockBody = null
let platform = null
let platformBody = null
let animationFrameId = null
let gameRunning = false
let canDrop = true
let blockRotation = { x: 0, y: 0, z: 0 }

// Touch Controls
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let isDragging = false
let lastSwipeTime = 0

// Block Types
const blockTypes = [
  { type: 'cube', size: [1, 1, 1], color: 0x4a90e2 },
  { type: 'cube', size: [1, 1.5, 1], color: 0x50c878 },
  { type: 'cube', size: [1.5, 1, 1], color: 0x9b59b6 },
  { type: 'cube', size: [1, 1, 1.5], color: 0xe74c3c },
  { type: 'cylinder', radius: 0.5, height: 1, color: 0xf39c12 },
]

// Initialize Three.js Scene
function initScene() {
  const container = canvasContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb) // Sky blue

  // Camera
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.set(5, 8, 10)
  camera.lookAt(0, 2, 0)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap pixel ratio for performance
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  scene.add(directionalLight)

  // Physics World
  world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })

  // Create Platform
  createPlatform()

  // Handle Window Resize
  window.addEventListener('resize', onWindowResize)
}

function createPlatform() {
  // Visual Platform
  const platformGeometry = new THREE.BoxGeometry(6, 0.2, 6)
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x95a5a6 })
  platform = new THREE.Mesh(platformGeometry, platformMaterial)
  platform.position.set(0, 0, 0)
  platform.receiveShadow = true
  scene.add(platform)

  // Physics Platform
  const platformColliderDesc = RAPIER.ColliderDesc.cuboid(3, 0.1, 3)
    .setTranslation(0, 0, 0)
  platformBody = world.createCollider(platformColliderDesc)
}

function createParticleEffect(position, color, count = 20) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    // Initial positions
    positions[i3] = position.x + (Math.random() - 0.5) * 0.2
    positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2
    positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.2

    // Velocities
    velocities[i3] = (Math.random() - 0.5) * 2
    velocities[i3 + 1] = Math.random() * 2 + 1
    velocities[i3 + 2] = (Math.random() - 0.5) * 2

    // Colors
    const c = new THREE.Color(color)
    colors[i3] = c.r
    colors[i3 + 1] = c.g
    colors[i3 + 2] = c.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)

  let lifetime = 1.0
  const animate = () => {
    lifetime -= 0.02
    if (lifetime <= 0) {
      scene.remove(particles)
      geometry.dispose()
      material.dispose()
      return
    }

    const positions = geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] += velocities[i3] * 0.05
      positions[i3 + 1] += velocities[i3 + 1] * 0.05
      positions[i3 + 2] += velocities[i3 + 2] * 0.05
      velocities[i3 + 1] -= 0.1 // gravity
    }
    geometry.attributes.position.needsUpdate = true
    material.opacity = lifetime
  }

  const interval = setInterval(() => {
    animate()
    if (lifetime <= 0) clearInterval(interval)
  }, 16)

  return particles
}

function createBlock(type, position = { x: 0, y: 5, z: 0 }) {
  const blockData = blockTypes[Math.floor(Math.random() * blockTypes.length)]
  nextBlockType.value = blockData.type

  let geometry, colliderDesc
  let mesh, body

  if (blockData.type === 'cube') {
    const [w, h, d] = blockData.size
    geometry = new THREE.BoxGeometry(w, h, d)
    colliderDesc = RAPIER.ColliderDesc.cuboid(w/2, h/2, d/2)
  } else if (blockData.type === 'cylinder') {
    geometry = new THREE.CylinderGeometry(
      blockData.radius,
      blockData.radius,
      blockData.height,
      16
    )
    colliderDesc = RAPIER.ColliderDesc.cylinder(blockData.height/2, blockData.radius)
  }

  const material = new THREE.MeshStandardMaterial({
    color: blockData.color,
    metalness: 0.3,
    roughness: 0.6
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true

  // Add slight glow effect
  const emissiveMaterial = material.clone()
  emissiveMaterial.emissive = new THREE.Color(blockData.color).multiplyScalar(0.1)
  mesh.material = emissiveMaterial

  // Position
  mesh.position.set(position.x, position.y, position.z)

  // Physics Body
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
  
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  const collider = world.createCollider(colliderDesc, rigidBody)
  
  body = rigidBody

  scene.add(mesh)

  return { mesh, body, type: blockData.type, color: blockData.color }
}

function spawnNextBlock() {
  if (!gameRunning || !canDrop) return

  const towerHeight = getTowerHeight()
  const spawnHeight = Math.max(towerHeight + 3, 5)

  currentBlock = createBlock(nextBlockType.value, { x: 0, y: spawnHeight, z: 0 })
  currentBlockBody = currentBlock.body
  
  // Reset rotation
  blockRotation = { x: 0, y: 0, z: 0 }
  updateBlockRotation()

  canDrop = true
  showControlsHint.value = true
}

function updateBlockRotation() {
  if (!currentBlock || !currentBlockBody) return
  
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(blockRotation.x),
    THREE.MathUtils.degToRad(blockRotation.y),
    THREE.MathUtils.degToRad(blockRotation.z)
  )
  const quaternion = new THREE.Quaternion().setFromEuler(euler)
  
  currentBlock.mesh.setRotationFromQuaternion(quaternion)
  
  // Update physics body rotation using Rapier Quaternion
  const rapierQuat = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }
  currentBlockBody.setRotation(rapierQuat)
}

function dropBlock() {
  if (!currentBlock || !canDrop || !gameRunning) return

  canDrop = false
  showControlsHint.value = false

  // Block is now falling - wait for it to settle
  physicsObjects.push({
    mesh: currentBlock.mesh,
    body: currentBlockBody,
    placed: false
  })

  currentBlock = null
  currentBlockBody = null

  // Check stability after a delay
  setTimeout(checkStability, 1000)
}

function checkStability() {
  // Check if any blocks have fallen significantly
  let hasCollapsed = false
  let maxHeight = 0
  let settledBlock = null

  physicsObjects.forEach((obj, index) => {
    const pos = obj.body.translation()
    maxHeight = Math.max(maxHeight, pos.y)

    // If block fell below platform level
    if (pos.y < -1) {
      hasCollapsed = true
    }

    // Mark as placed after settling
    if (!obj.placed && pos.y > 0.5) {
      obj.placed = true
      settledBlock = obj
    }
  })

  height.value = Math.floor(maxHeight)

  if (hasCollapsed) {
    // Create collapse particle effect
    physicsObjects.forEach(obj => {
      if (obj.placed) {
        const pos = obj.body.translation()
        createParticleEffect(
          { x: pos.x, y: pos.y, z: pos.z },
          obj.mesh.material.color,
          15
        )
      }
    })
    endGame()
    return
  }

  // Award points and spawn next block
  if (physicsObjects.length > 0 && settledBlock) {
    const pos = settledBlock.body.translation()
    // Create success particle effect
    createParticleEffect(
      { x: pos.x, y: pos.y + 0.5, z: pos.z },
      settledBlock.mesh.material.color,
      30
    )
    awardPoints()
    setTimeout(() => spawnNextBlock(), 500)
  }
}

function awardPoints() {
  blocksPlaced.value++
  const basePoints = 10
  const heightBonus = height.value * 5
  const points = Math.round((basePoints + heightBonus) * combo.value)

  score.value += points
  combo.value = Math.min(5.0, combo.value + 0.1)
  bestCombo.value = Math.max(bestCombo.value, combo.value)

  if (blocksPlaced.value % 5 === 0) {
    addToast(`Height ${height.value} blocks!`, 'success')
  }
}

function getTowerHeight() {
  let maxY = 0
  physicsObjects.forEach(obj => {
    const pos = obj.body.translation()
    maxY = Math.max(maxY, pos.y)
  })
  return maxY
}

function endGame() {
  gameRunning = false
  showGameOver.value = true
}

function startGame() {
  showTutorial.value = false
  showGameOver.value = false
  gameRunning = true
  score.value = 0
  height.value = 0
  combo.value = 1.0
  blocksPlaced.value = 0

  // Clear existing blocks
  physicsObjects.forEach(obj => {
    scene.remove(obj.mesh)
    world.removeRigidBody(obj.body)
  })
  physicsObjects = []

  // Spawn first block
  spawnNextBlock()
  animate()
}

function resetGame() {
  startGame()
}

function addToast(message, type = 'info') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }, 3000)
}

// Touch Controls
function handleTouchStart(e) {
  e.preventDefault()
  const touch = e.touches[0] || e
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
  isDragging = false
}

function handleTouchMove(e) {
  e.preventDefault()
  const touch = e.touches[0] || e
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  const deltaTime = Date.now() - touchStartTime

  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    isDragging = true
  }

  // Prevent swipes if too frequent
  if (Date.now() - lastSwipeTime < 100) return

  // Detect swipe
  if (deltaTime < 300 && Math.abs(deltaX) + Math.abs(deltaY) > 30) {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        rotateBlock('y', 90)
      } else {
        rotateBlock('y', -90)
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        rotateBlock('x', 90)
      } else {
        rotateBlock('x', -90)
      }
    }

    lastSwipeTime = Date.now()
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }
}

function handleTouchEnd(e) {
  e.preventDefault()
  const touch = e.changedTouches?.[0] || e
  const deltaTime = Date.now() - touchStartTime
  const deltaX = Math.abs(touch.clientX - touchStartX)
  const deltaY = Math.abs(touch.clientY - touchStartY)

  // If not dragging and quick tap, drop block
  if (!isDragging && deltaTime < 200 && deltaX < 10 && deltaY < 10) {
    dropBlock()
  }

  isDragging = false
}

function rotateBlock(axis, degrees) {
  if (!currentBlock || !canDrop) return
  blockRotation[axis] += degrees
  updateBlockRotation()
}

// Mouse Controls (for desktop)
function handleMouseDown(e) {
  handleTouchStart(e)
}

function handleMouseMove(e) {
  if (e.buttons === 1) {
    handleTouchMove(e)
  }
}

function handleMouseUp(e) {
  handleTouchEnd(e)
}

// Keyboard Controls
function handleKeyDown(e) {
  if (!gameRunning) return

  switch(e.key) {
    case ' ':
      e.preventDefault()
      dropBlock()
      break
    case 'ArrowLeft':
      e.preventDefault()
      rotateBlock('y', -90)
      break
    case 'ArrowRight':
      e.preventDefault()
      rotateBlock('y', 90)
      break
    case 'ArrowUp':
      e.preventDefault()
      rotateBlock('x', -90)
      break
    case 'ArrowDown':
      e.preventDefault()
      rotateBlock('x', 90)
      break
  }
}

function onWindowResize() {
  if (!camera || !renderer || !canvasContainer.value) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  if (!gameRunning) return

  animationFrameId = requestAnimationFrame(animate)

  // Step physics
  world.step()

  // Update Three.js meshes from physics
  physicsObjects.forEach(obj => {
    const pos = obj.body.translation()
    const rot = obj.body.rotation()
    obj.mesh.position.set(pos.x, pos.y, pos.z)
    if (rot) {
      obj.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    }
  })

  // Update camera to follow tower
  const towerHeight = getTowerHeight()
  const targetY = Math.max(towerHeight * 0.5 + 3, 5)
  camera.position.y += (targetY - camera.position.y) * 0.05
  camera.lookAt(0, towerHeight * 0.3, 0)

  renderer.render(scene, camera)
}

onMounted(() => {
  nextTick(() => {
    initScene()

    // Check if tutorial was seen
    if (!localStorage.getItem('stackbalance_tutorial_seen')) {
      showTutorial.value = true
      localStorage.setItem('stackbalance_tutorial_seen', 'true')
    } else {
      startGame()
    }

    // Event Listeners
    const container = canvasContainer.value
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)
  })
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Styles will be in style.css */
</style>

