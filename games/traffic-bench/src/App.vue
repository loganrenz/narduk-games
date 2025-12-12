<script setup>
import { computed, onMounted, ref } from 'vue'

const fallbackBenchmarks = ['gpt-o3', 'claude-3-5']

const isLoading = ref(false)
const loadError = ref('')
const benchmarks = ref([])
const selected = ref('')

const iframeSrc = computed(() => {
  if (!selected.value) return ''
  const folder = encodeURIComponent(selected.value)
  return `/outputs/${folder}/index.html`
})

function parseDirectoryListingHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const links = Array.from(doc.querySelectorAll('a[href]'))
  const dirs = links
    .map((a) => a.getAttribute('href') || '')
    .filter((href) => href && href !== '../')
    .map((href) => href.replace(/^\.\//, ''))
    .filter((href) => href.endsWith('/'))
    .map((href) => href.replace(/\/$/, ''))
    .filter((name) => name && !name.includes('/'))

  return Array.from(new Set(dirs)).sort()
}

async function loadBenchmarks() {
  isLoading.value = true
  loadError.value = ''

  try {
    const res = await fetch('/outputs/', { headers: { Accept: 'text/html,application/json' } })
    if (!res.ok) throw new Error(`Failed to fetch /outputs/ (HTTP ${res.status})`)

    const contentType = (res.headers.get('content-type') || '').toLowerCase()

    if (contentType.includes('application/json')) {
      const data = await res.json()
      const list = Array.isArray(data) ? data : data?.folders || data?.dirs || data?.results
      if (Array.isArray(list) && list.length) {
        benchmarks.value = list.map(String).filter(Boolean)
        return
      }
      throw new Error('No folders found in /outputs/ JSON response')
    }

    const html = await res.text()
    const dirs = parseDirectoryListingHtml(html)
    if (dirs.length) {
      benchmarks.value = dirs
      return
    }

    throw new Error('No subfolders found in /outputs/ listing')
  } catch (e) {
    loadError.value = e?.message || String(e)
    benchmarks.value = [...fallbackBenchmarks]
  } finally {
    if (!selected.value && benchmarks.value.length) selected.value = benchmarks.value[0]
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
        <div class="subtitle">Select a run in <code>/outputs</code></div>
      </div>

      <div class="sidebar__controls">
        <button class="btn" type="button" @click="loadBenchmarks" :disabled="isLoading">
          {{ isLoading ? 'Loading…' : 'Refresh' }}
        </button>
        <div v-if="loadError" class="hint">
          Couldn’t list <code>/outputs/</code>; using fallback.
        </div>
      </div>

      <nav class="list" aria-label="Benchmark folders">
        <button
          v-for="name in benchmarks"
          :key="name"
          type="button"
          class="list__item"
          :class="{ 'list__item--active': name === selected }"
          @click="selected = name"
        >
          <span class="dot" aria-hidden="true" />
          <span class="label">{{ name }}</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <div v-if="!iframeSrc" class="empty">
        Choose a folder from the left to load <code>/outputs/&lt;folder&gt;/index.html</code>.
      </div>
      <iframe
        v-else
        class="viewer"
        :key="iframeSrc"
        :src="iframeSrc"
        title="Benchmark output"
        loading="lazy"
      />
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
}
</style>
