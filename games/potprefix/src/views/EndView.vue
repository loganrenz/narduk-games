<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="grid-card">
    <div class="flex items-center justify-between">
      <div>
        <p class="uppercase text-xs text-white/60">Chain Complete</p>
        <h1 class="text-2xl font-bold">Cashed out or busted?</h1>
      </div>
      <RouterLink class="btn btn-primary" to="/game">Start a new pot</RouterLink>
    </div>
    <p class="text-white/80">
      This end screen will celebrate streaks, show the biggest pot of the session, and offer a shareable brag line
      like "Hit a 12-chain for 2,000 chips!". For now, hop back into the loop and keep prefixing.
    </p>
  </section>
</template>
