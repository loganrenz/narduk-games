// Trie data structure for efficient word validation
class TrieNode {
  children: Map<string, TrieNode>
  isEndOfWord: boolean

  constructor() {
    this.children = new Map()
    this.isEndOfWord = false
  }
}

export class Trie {
  private root: TrieNode

  constructor() {
    this.root = new TrieNode()
  }

  insert(word: string): void {
    let node = this.root
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
    }
    node.isEndOfWord = true
  }

  search(word: string): boolean {
    let node = this.root
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) {
        return false
      }
      node = node.children.get(char)!
    }
    return node.isEndOfWord
  }

  startsWith(prefix: string): boolean {
    let node = this.root
    for (const char of prefix.toUpperCase()) {
      if (!node.children.has(char)) {
        return false
      }
      node = node.children.get(char)!
    }
    return true
  }

  // Get words that start with the prefix (for hints)
  getWordsWithPrefix(prefix: string, maxResults: number = 10): string[] {
    const results: string[] = []
    let node = this.root
    
    // Navigate to the prefix node
    for (const char of prefix.toUpperCase()) {
      if (!node.children.has(char)) {
        return results
      }
      node = node.children.get(char)!
    }

    // DFS to find all words with this prefix
    this.dfs(node, prefix.toUpperCase(), results, maxResults)
    return results
  }

  private dfs(node: TrieNode, current: string, results: string[], maxResults: number): void {
    if (results.length >= maxResults) return

    if (node.isEndOfWord) {
      results.push(current)
    }

    for (const [char, childNode] of node.children) {
      this.dfs(childNode, current + char, results, maxResults)
    }
  }
}

// Dictionary manager with loading and caching
export class DictionaryManager {
  private trie: Trie
  private loaded: boolean = false
  private loading: Promise<void> | null = null

  constructor() {
    this.trie = new Trie()
  }

  async loadDictionary(url: string = '/dictionary.json'): Promise<void> {
    if (this.loaded) return
    if (this.loading) return this.loading

    this.loading = (async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to load dictionary')
        }
        const words: string[] = await response.json()
        
        for (const word of words) {
          // Filter: 3-15 letters, A-Z only
          if (word.length >= 3 && word.length <= 15 && /^[A-Z]+$/.test(word)) {
            this.trie.insert(word)
          }
        }
        
        this.loaded = true
      } catch (error) {
        console.error('Failed to load dictionary:', error)
        // Load fallback words
        this.loadFallbackWords()
        this.loaded = true
      }
    })()

    return this.loading
  }

  private loadFallbackWords(): void {
    // Fallback word list for basic functionality
    const fallbackWords = [
      'CAT', 'CATS', 'CAST', 'COAST', 'COATS', 'BOAT', 'BOATS', 'BOAST',
      'DOG', 'DOGS', 'DOGE', 'DODGE', 'DOSED', 'DOSE',
      'THE', 'THEM', 'THEME', 'THESE', 'THERE', 'THREE',
      'AND', 'BAND', 'BLAND', 'BRAND', 'GRAND',
      'RUN', 'RUNS', 'RUNES', 'PRUNE', 'PRUNES',
      'CAR', 'CARD', 'CARED', 'SCARED', 'SCAR', 'SCORE',
      'HAT', 'HATE', 'HATER', 'HEAT', 'HEART',
      'BIG', 'BIGS', 'BEGIN', 'BEING',
      'SET', 'SETS', 'RESET', 'PRESET',
      'BAT', 'BATS', 'BEAST', 'BEAT', 'BETA'
    ]
    
    for (const word of fallbackWords) {
      this.trie.insert(word)
    }
  }

  isValidWord(word: string): boolean {
    if (!this.loaded) {
      console.warn('Dictionary not loaded yet')
      return false
    }
    return word.length >= 3 && this.trie.search(word)
  }

  getHints(prefix: string, count: number = 5): string[] {
    if (!this.loaded) return []
    return this.trie.getWordsWithPrefix(prefix, count)
  }

  isLoaded(): boolean {
    return this.loaded
  }
}

// Global dictionary instance
export const dictionary = new DictionaryManager()
