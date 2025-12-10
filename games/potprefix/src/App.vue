<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-casino-table to-slate-950 text-slate-100">
    <header class="sticky top-0 z-10 bg-casino-table/90 backdrop-blur border-b border-white/5 shadow-neon">
      <div class="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2 font-bold tracking-wide text-lg">
          <span class="text-casino-neon">PotPrefix</span>
          <span class="text-sm text-white/60">Build word chains with prefixes</span>
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm">
          <RouterLink class="btn btn-ghost" to="/game">Play</RouterLink>
          <RouterLink class="btn btn-ghost" to="/auth">Login</RouterLink>
        </nav>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <RouterView />
    </main>
  </div>
</template>
