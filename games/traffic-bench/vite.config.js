import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => {
  // In the monorepo deployment, this app is served from `/traffic-bench/`.
  // Defaulting the build `base` prevents requests like `/assets/...` and `/models.json`
  // (which would 404 when the app is mounted at a subpath).
  const base =
    command === 'serve'
      ? '/'
      : process.env.VITE_BASE_PATH || '/traffic-bench/'

  return {
    plugins: [vue()],
    base,
    server: {
      port: 2348,
      open: false,
    },
  }
})
