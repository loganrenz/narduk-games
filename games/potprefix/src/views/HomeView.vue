<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3">
      <p class="uppercase text-sm text-white/60">Gambling-themed prefix ladders</p>
      <h1 class="text-4xl font-black tracking-tight text-white">Stack prefixes, grow the pot, and decide when to bail.</h1>
      <p class="text-lg text-white/80 max-w-3xl">
        PotPrefix is a single-player PWA built for quick two-tap turns on iPhone. Ante chips, pick a prefix letter,
        and watch the pot climb with chain multipliers. Cash out before you bust, or keep pressing your luck for
        neon-highlighted jackpots.
      </p>
      <div class="flex gap-3">
        <RouterLink class="btn btn-primary" to="/game">Jump into the MVP</RouterLink>
        <RouterLink class="btn btn-ghost" to="/auth">Log in for sync</RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Bankroll</p>
        <p class="text-2xl font-bold">Start with 1,000 chips</p>
        <p class="text-sm text-white/60">Cloud-synced with D1 when authenticated.</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Chain Multiplier</p>
        <p class="text-2xl font-bold">x1.2 per link</p>
        <p class="text-sm text-white/60">Rare letters hit x1.5; chain 10 triggers a jackpot.</p>
      </div>
      <div class="stat-tile">
        <p class="text-xs uppercase text-white/60">Flow</p>
        <p class="text-2xl font-bold">2–3 taps</p>
        <p class="text-sm text-white/60">Tap a letter, tap an ante, then "Risk It" or cash out.</p>
      </div>
    </div>

    <div class="grid-card">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-semibold">MVP checklist</h2>
        <span class="text-xs uppercase text-white/60">1-week target</span>
      </div>
      <ul class="space-y-2 text-white/80 list-disc list-inside">
        <li>Endless mode with local bankroll, pots, and chain history.</li>
        <li>Pinia store for ante math and Trie-based prefix validation.</li>
        <li>Touch-friendly alphabet grid with neon previews and bust feedback.</li>
        <li>Offline-first play; login hooks ready for D1 JWT endpoints.</li>
        <li>Tailwind + Vite PWA shell optimized for iPhone taps and haptics.</li>
      </ul>
    </div>

    <div class="grid-card">
      <h2 class="text-2xl font-semibold">Game modes</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="stat-tile">
          <h3 class="font-semibold text-lg">Endless</h3>
          <p class="text-white/80">Keep pushing for bigger pots. Busting wipes the pot, not the bankroll.</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg">Timed Rush</h3>
          <p class="text-white/80">Two-minute sprints favor bold ante chains for leaderboard runs.</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg">Zen</h3>
          <p class="text-white/80">No losses—just pure prefix ladders and flow-state play.</p>
        </div>
        <div class="stat-tile">
          <h3 class="font-semibold text-lg">Daily</h3>
          <p class="text-white/80">Shared seeds with global top pots pulled from Cloudflare D1.</p>
        </div>
      </div>
    </div>
  </section>
</template>
