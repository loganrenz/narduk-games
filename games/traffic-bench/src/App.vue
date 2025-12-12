<script setup>
import { computed, onMounted, ref } from 'vue'

const isLoading = ref(false)
const loadError = ref('')
const benchmarks = ref([])
const selected = ref([])

const baseUrl = computed(() => import.meta.env.BASE_URL || '/')

function outputsIndexUrlFor(name) {
  const folder = encodeURIComponent(name)
  return new URL(`outputs/${folder}/index.html`, baseUrl.value).toString()
}

const selectedIframes = computed(() => {
  return selected.value.map((name) => ({
    name,
    src: outputsIndexUrlFor(name),
  }))
})

function toggleSelected(name) {
  const idx = selected.value.indexOf(name)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(name)
}

async function loadBenchmarks() {
  isLoading.value = true
  loadError.value = ''

  try {
    // Primary: build-generated list of model folders.
    const modelsUrl = new URL('models.json', baseUrl.value).toString()
    const res = await fetch(modelsUrl, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Failed to fetch models list (HTTP ${res.status})`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : data?.models || data?.results
    const names = (Array.isArray(list) ? list : [])
      .map((v) => (typeof v === 'string' ? v : v?.name))
      .map((v) => String(v || '').trim())
      .filter(Boolean)

    if (!names.length) throw new Error('No output folders found in models.json')
    benchmarks.value = names
  } catch (e) {
    loadError.value = e?.message || String(e)
    benchmarks.value = []
  } finally {
    if (!selected.value.length && benchmarks.value.length) selected.value = [benchmarks.value[0]]
    isLoading.value = false
  }
}

onMounted(() => {
  loadBenchmarks()
})
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar__header">
        <div class="title">Traffic Bench</div>
        <div class="subtitle">Select runs (multi-select) to compare</div>
      </div>

      <div class="sidebar__controls">
        <button class="btn" type="button" @click="loadBenchmarks" :disabled="isLoading">
          {{ isLoading ? 'Loading…' : 'Refresh' }}
        </button>
        <div v-if="loadError" class="hint">
          {{ loadError }}
        </div>
      </div>

      <nav class="list" aria-label="Benchmark folders">
        <button v-for="name in benchmarks" :key="name" type="button" class="list__item" :class="{ 'list__item--active': selected.includes(name) }" @click="toggleSelected(name)">
          <span class="dot" aria-hidden="true" />
          <span class="label">{{ name }}</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <div v-if="!selectedIframes.length" class="empty">
        Select one or more runs on the left.
      </div>
      <div v-else class="grid" :style="{ '--cols': Math.min(3, selectedIframes.length) }">
        <section v-for="item in selectedIframes" :key="item.src" class="panel">
          <header class="panel__header">
            <div class="panel__title">{{ item.name }}</div>
            <a class="panel__link" :href="item.src" target="_blank" rel="noopener noreferrer">Open</a>
          </header>
          <iframe class="viewer" :src="item.src" :title="`Benchmark output: ${item.name}`" loading="lazy" />
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 320px 1fr;
  background: #0b0b10;
  color: #eaeaf2;
}

.sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: #0f0f16;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar__header {
  padding: 18px 16px 12px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(234, 234, 242, 0.7);
}

.sidebar__controls {
  padding: 0 16px 12px;
  display: grid;
  gap: 10px;
}

.btn {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: rgba(234, 234, 242, 0.65);
}

.list {
  padding: 6px;
  overflow: auto;
  flex: 1;
}

.list__item {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 10px;
  align-items: center;
  text-align: left;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.list__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.list__item--active {
  background: rgba(99, 102, 241, 0.14);
  border-color: rgba(99, 102, 241, 0.35);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
}

.list__item--active .dot {
  background: rgba(99, 102, 241, 1);
}

.label {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main {
  min-width: 0;
  height: 100vh;
  background: #0b0b10;
}

.grid {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
}

.panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 38px 1fr;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 15, 22, 0.9);
}

.panel__title {
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel__link {
  font-size: 12px;
  color: rgba(234, 234, 242, 0.85);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 4px 8px;
  border-radius: 10px;
}

.panel__link:hover {
  background: rgba(255, 255, 255, 0.06);
}

.empty {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  color: rgba(234, 234, 242, 0.72);
}

.viewer {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: white;
}

@media (max-width: 820px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 260px 1fr;
  }
  .sidebar {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
