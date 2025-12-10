<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3">
      <p class="uppercase text-sm text-white/60">Word-building prefix game</p>
      <h1 class="text-4xl font-black tracking-tight text-white">Build word chains by adding prefixes</h1>
      <p class="text-lg text-white/80 max-w-3xl">
        PotPrefix is a simple, addictive word game. Start with a seed word, then add letters as prefixes to build
        longer and longer words. Each word in your chain earns points based on length and position. Build the longest
        chain possible and beat your high score!
      </p>
      <div class="flex gap-3">
        <RouterLink class="btn btn-primary" to="/game">Start Playing</RouterLink>
        <RouterLink class="btn btn-ghost" to="/auth">Log in for sync</RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Scoring</p>
        <p class="text-2xl font-bold">Points per word</p>
        <p class="text-sm text-white/60">Base points × word length + chain bonus + rare letter bonus</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Chain Bonuses</p>
        <p class="text-2xl font-bold">x1.5 at 5 words</p>
        <p class="text-sm text-white/60">x2 at 10 words, x3 at 15 words</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">How to Play</p>
        <p class="text-2xl font-bold">Tap & Build</p>
        <p class="text-sm text-white/60">Tap a letter to preview, then build if valid</p>
      </div>
    </div>

    <div class="grid-card">
      <h2 class="text-2xl font-semibold mb-4">Example Game</h2>
      <div class="space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm text-white/60">Start:</span>
          <span class="px-3 py-1 bg-white/10 rounded-lg font-mono">INK</span>
          <span class="text-white/40">→</span>
          <span class="px-3 py-1 bg-casino-neon/20 border border-casino-neon rounded-lg font-mono text-casino-neon">L + INK = LINK</span>
          <span class="text-white/40">→</span>
          <span class="px-3 py-1 bg-casino-neon/20 border border-casino-neon rounded-lg font-mono text-casino-neon">B + LINK = BLINK</span>
          <span class="text-white/40">→</span>
          <span class="px-3 py-1 bg-casino-neon/20 border border-casino-neon rounded-lg font-mono text-casino-neon">D + BLINK = DRINK</span>
        </div>
        <p class="text-sm text-white/60">
          Each word in the chain earns points. Longer words and longer chains = higher scores!
        </p>
      </div>
    </div>

    <div class="grid-card">
      <h2 class="text-2xl font-semibold mb-4">Game Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="stat-tile">
          <h3 class="font-semibold text-lg mb-2">Simple Rules</h3>
          <p class="text-white/80 text-sm">Just tap a letter, preview the word, and build if it's valid. No complex mechanics to learn.</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg mb-2">Visual Feedback</h3>
          <p class="text-white/80 text-sm">See your word chain grow in real-time. Valid letters are highlighted, invalid ones are clearly marked.</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg mb-2">Score Tracking</h3>
          <p class="text-white/80 text-sm">Track your score and high score. Challenge yourself to build longer chains!</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg mb-2">Rare Letter Bonuses</h3>
          <p class="text-white/80 text-sm">Words with Q, Z, J, or X earn bonus points. Use them strategically!</p>
        </div>
      </div>
    </div>
  </section>
</template>
