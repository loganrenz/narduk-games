const sampleWords = [
  'INK',
  'LINK',
  'BLINK',
  'DRINK',
  'SINK',
  'PINK',
  'POT',
  'SPOT',
  'SPORT',
  'IMPORT',
  'EXPORT',
  'SORT',
  'FORT',
  'PORT',
  'TOOL',
  'SPOOL',
  'SCHOOL',
  'COOL',
  'RULE',
  'CRUEL',
  'TRAIL',
  'RETRAIL',
  'MAIL',
  'EMAIL',
  'FAIL',
  'QUAIL',
  'XENON',
  'JOKE',
  'ZINC',
  'RINK',
  'BRINK',
  'PRINK',
  'DUST',
  'TRUST',
  'ADJUST',
  'JUST',
  'RUST',
  'CRUST',
  'MINT',
  'PRINT',
  'SPRINT',
]

const wordSet = new Set(sampleWords)

export const trie = {
  has(word: string) {
    return wordSet.has(word.toUpperCase())
  },
}

const seeds = sampleWords.filter((word) => word.length >= 3 && word.length <= 5)

export const getSeed = () => seeds[Math.floor(Math.random() * seeds.length)] || 'INK'
