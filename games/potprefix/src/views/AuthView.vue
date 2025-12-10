<script setup lang="ts">
const message = `Cloud sync hooks are ready. The MVP keeps bankroll local while wiring up JWT login later.`
</script>

<template>
  <section class="grid-card">
    <div class="flex items-center justify-between">
      <div>
        <p class="uppercase text-xs text-white/60">Account</p>
        <h1 class="text-2xl font-bold">Login & bankroll sync</h1>
      </div>
      <span class="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10">Cloudflare D1</span>
    </div>
    <p class="text-white/80">{{ message }}</p>
    <form class="grid gap-3 max-w-md">
      <label class="text-sm text-white/70" for="email">Email</label>
      <input
        id="email"
        type="email"
        placeholder="player@potprefix.gg"
        class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-casino-neon"
      />
      <label class="text-sm text-white/70" for="password">Password</label>
      <input
        id="password"
        type="password"
        class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-casino-neon"
      />
      <button type="button" class="btn btn-primary w-full">Sign in (stub)</button>
      <p class="text-xs text-white/50">
        Worker endpoints: <code>/auth/login</code>, <code>/chips/update</code>, <code>/score/submit</code>, and
        <code>/daily</code> will slot in here. Until then, bankroll stays on-device.
      </p>
    </form>
  </section>
</template>
