import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePotStore } from './potprefix'

describe('usePotStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with bankroll and seed', () => {
    const store = usePotStore()
    expect(store.bankroll).toBeGreaterThan(0)
    expect(store.currentWord.length).toBeGreaterThanOrEqual(3)
  })

  it('applies ante to pot when preview is valid', () => {
    const store = usePotStore()
    store.reset('INK')
    store.tryPrefix('L')
    const success = store.riskAnte(50)
    expect(success).toBe(true)
    expect(store.pot).toBeGreaterThan(0)
    expect(store.chain.at(-1)).toBe('LINK')
  })

  it('prevents risking when preview is invalid', () => {
    const store = usePotStore()
    store.reset('INK')
    store.tryPrefix('V') // not in sample trie
    const success = store.riskAnte(50)
    expect(success).toBe(false)
    expect(store.pot).toBe(0)
  })
})
