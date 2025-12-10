import { createRouter, createWebHistory } from 'vue-router'
import GameView from './views/GameView.vue'
import HomeView from './views/HomeView.vue'
import AuthView from './views/AuthView.vue'
import EndView from './views/EndView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game', name: 'game', component: GameView },
    { path: '/auth', name: 'auth', component: AuthView },
    { path: '/end', name: 'end', component: EndView },
  ],
})

export default router
