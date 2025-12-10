import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Constants matching App.vue
const GAME_START_DATE = new Date(2024, 0, 1) // January 1, 2024

function getDayNumber(date = new Date()) {
  const start = new Date(GAME_START_DATE)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target - start) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff) // Never return negative
}

// Filter for words that are "not too tricky"
// Exclude words with uncommon letters (Q, X, Z) or very rare patterns
function isNotTooTricky(word) {
  const upperWord = word.toUpperCase()
  
  // Must be exactly 5 letters
  if (upperWord.length !== 5) return false
  
  // Exclude words with uncommon letters (Q, X, Z)
  if (/[QXZ]/.test(upperWord)) return false
  
  // Exclude words with too many repeated letters (more than 2 of the same letter)
  const letterCounts = {}
  for (const letter of upperWord) {
    letterCounts[letter] = (letterCounts[letter] || 0) + 1
    if (letterCounts[letter] > 2) return false
  }
  
  // Exclude words with unusual consonant clusters (3+ consecutive consonants)
  // Common patterns like STR, SPR are okay, but we'll be conservative
  if (/[BCDFGHJKLMNPQRSTVWXYZ]{4,}/.test(upperWord)) return false
  
  // Only allow letters (no numbers, special chars)
  if (!/^[A-Z]+$/.test(upperWord)) return false
  
  return true
}

// Load dictionary
console.log('Loading dictionary...')
const dictPath = join(__dirname, 'public', 'dictionary.json')
const dictionary = JSON.parse(readFileSync(dictPath, 'utf-8'))

// Filter for 5-letter words that are not too tricky
console.log('Filtering words...')
const allWords = Object.keys(dictionary)
const fiveLetterWords = allWords.filter(word => word.length === 5)
const notTrickyWords = fiveLetterWords.filter(isNotTooTricky)

console.log(`Total words in dictionary: ${allWords.length}`)
console.log(`5-letter words: ${fiveLetterWords.length}`)
console.log(`Not too tricky 5-letter words: ${notTrickyWords.length}`)

if (notTrickyWords.length === 0) {
  console.error('No suitable words found!')
  process.exit(1)
}

// Calculate day numbers for the next 5 years
const today = new Date()
const fiveYearsFromNow = new Date(today)
fiveYearsFromNow.setFullYear(today.getFullYear() + 5)

const startDayNumber = getDayNumber(today)
const endDayNumber = getDayNumber(fiveYearsFromNow)

console.log(`\nCalculating day numbers from ${today.toISOString().split('T')[0]} to ${fiveYearsFromNow.toISOString().split('T')[0]}`)
console.log(`Day number range: ${startDayNumber} to ${endDayNumber}`)
console.log(`Total days to populate: ${endDayNumber - startDayNumber + 1}`)

// Shuffle words to ensure variety
const shuffledWords = [...notTrickyWords]
for (let i = shuffledWords.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]]
}

// Assign words to each day number
const dailyWords = []
for (let dayNum = startDayNumber; dayNum <= endDayNumber; dayNum++) {
  const wordIndex = dayNum % shuffledWords.length
  const word = shuffledWords[wordIndex].toUpperCase()
  dailyWords.push({ day_number: dayNum, word })
}

console.log(`\nPrepared ${dailyWords.length} word assignments`)

// Prepare SQL insert statements
// We'll batch them to avoid command line length issues
const BATCH_SIZE = 100
const batches = []

for (let i = 0; i < dailyWords.length; i += BATCH_SIZE) {
  const batch = dailyWords.slice(i, i + BATCH_SIZE)
  const values = batch.map(({ day_number, word }) => 
    `(${day_number}, '${word.replace(/'/g, "''")}', unixepoch())`
  ).join(',\n  ')
  
  const sql = `INSERT OR IGNORE INTO daily_words (day_number, word, created_at) VALUES\n  ${values};`
  batches.push(sql)
}

console.log(`\nPrepared ${batches.length} SQL batches`)

// Execute migrations first to ensure table exists
console.log('\nApplying migrations...')
try {
  execSync('wrangler d1 migrations apply d6596363-f299-4658-b32e-2934ab20105a --remote', {
    cwd: __dirname,
    stdio: 'inherit'
  })
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exit(1)
}

// Insert words in batches
console.log('\nInserting words into database...')
for (let i = 0; i < batches.length; i++) {
  console.log(`Inserting batch ${i + 1}/${batches.length}...`)
  
  // Write SQL to temp file to avoid command line length issues
  const tempFile = join(__dirname, `temp_batch_${i}.sql`)
  writeFileSync(tempFile, batches[i])
  
  try {
    execSync(`wrangler d1 execute d6596363-f299-4658-b32e-2934ab20105a --remote --file=${tempFile}`, {
      cwd: __dirname,
      stdio: 'inherit'
    })
    // Clean up temp file
    unlinkSync(tempFile)
  } catch (error) {
    console.error(`Batch ${i + 1} failed:`, error.message)
    // Clean up temp file even on error
    if (existsSync(tempFile)) {
      unlinkSync(tempFile)
    }
    process.exit(1)
  }
}

console.log('\n✅ Successfully populated daily words table!')
console.log(`   Inserted ${dailyWords.length} words for days ${startDayNumber} to ${endDayNumber}`)
