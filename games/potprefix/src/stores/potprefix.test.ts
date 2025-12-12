import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePotStore } from './potprefix'

describe('usePotStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with a seed word and empty chain', () => {
    const store = usePotStore()
    expect(store.score).toBe(0)
    expect(store.chain.length).toBe(0)
    expect(store.currentWord.length).toBeGreaterThanOrEqual(3)
    expect(store.gameMode).toBe('endless')
    expect(store.gameOver).toBe(false)
  })

  it('builds a word when preview is valid', () => {
    const store = usePotStore()
    store.reset('INK')
    expect(store.tryPrefix('L')).toBe(true)

    const success = store.buildWord()
    expect(success).toBe(true)
    expect(store.currentWord).toBe('LINK')
    expect(store.chain.at(-1)).toBe('LINK')
    expect(store.score).toBeGreaterThan(0)
    expect(store.selectedLetter).toBe(null)
  })

  it('does not build a word when preview is invalid', () => {
    const store = usePotStore()
    store.reset('INK')
    const invalidLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .find(l => store.tryPrefix(l) === false)

    // The bundled trie should have at least one invalid prefix for a given seed;
    // if that ever changes, this test should be revisited.
    expect(invalidLetter).toBeTruthy()

    const success = store.buildWord()
    expect(success).toBe(false)
    expect(store.chain.length).toBe(0)
    expect(store.currentWord).toBe('INK')
    expect(store.score).toBe(0)
  })
})
