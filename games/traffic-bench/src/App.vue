<script setup>
import { computed, onMounted, ref } from 'vue'

const isLoading = ref(false)
const loadError = ref('')
const benchmarks = ref([])
const selected = ref([])

function isSelected(name) {
  return selected.value.includes(name)
}

function toggleSelected(name) {
  if (isSelected(name)) {
    selected.value = selected.value.filter((n) => n !== name)
  } else {
    selected.value = [...selected.value, name]
  }
}

function removeSelected(name) {
  selected.value = selected.value.filter((n) => n !== name)
}

const iframeItems = computed(() => {
  return selected.value.map((name) => {
    const folder = encodeURIComponent(name)
    const src = new URL(`outputs/${folder}/index.html`, import.meta.env.BASE_URL).toString()
    return { name, src }
  })
})

async function loadBenchmarks() {
  isLoading.value = true
  loadError.value = ''

  try {
    const modelsUrl = new URL('models.json', import.meta.env.BASE_URL).toString()
    const res = await fetch(modelsUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) throw new Error(`Failed to fetch models.json (HTTP ${res.status})`)

    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    benchmarks.value = list.map((m) => String(m?.name || '')).filter(Boolean)
  } catch (e) {
    loadError.value = e?.message || String(e)
    benchmarks.value = []
  } finally {
    // Default to first model if nothing selected
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
        <div class="subtitle">Select one or more outputs to compare</div>
      </div>

      <div class="sidebar__controls">
        <button class="btn" type="button" @click="loadBenchmarks" :disabled="isLoading">
          {{ isLoading ? 'Loading…' : 'Refresh' }}
        </button>
        <div v-if="loadError" class="hint">
          Couldn’t load <code>models.json</code>.
        </div>
        <div v-else class="hint">{{ selected.length }} selected</div>
      </div>

      <nav class="list" aria-label="Benchmark folders">
        <button
          v-for="name in benchmarks"
          :key="name"
          type="button"
          class="list__item"
          :class="{ 'list__item--active': isSelected(name) }"
          @click="toggleSelected(name)"
        >
          <input
            class="checkbox"
            type="checkbox"
            :checked="isSelected(name)"
            @click.stop
            @change="toggleSelected(name)"
            :aria-label="`Toggle ${name}`"
          />
          <span class="label">{{ name }}</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <div v-if="!iframeItems.length" class="empty">
        Select one or more models to load <code>outputs/&lt;folder&gt;/index.html</code>.
      </div>
      <div v-else class="grid" :style="{ '--cols': Math.min(iframeItems.length, 3) }">
        <section v-for="item in iframeItems" :key="item.name" class="panel">
          <header class="panel__header">
            <div class="panel__title" :title="item.name">{{ item.name }}</div>
            <button class="iconbtn" type="button" @click="removeSelected(item.name)" :aria-label="`Remove ${item.name}`">
              ✕
            </button>
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
  grid-template-columns: 18px 1fr;
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

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: rgba(99, 102, 241, 1);
  cursor: pointer;
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
  overflow: hidden;
}

.empty {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  color: rgba(234, 234, 242, 0.72);
}

.grid {
  height: 100%;
  width: 100%;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 10px;
}

.panel {
  min-width: 0;
  min-height: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-rows: 40px 1fr;
}

.panel__header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.18);
}

.panel__title {
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iconbtn {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 700;
  cursor: pointer;
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
