import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const OUTPUTS_DIR = path.join(ROOT, 'outputs')
const PUBLIC_DIR = path.join(ROOT, 'public')
const PUBLIC_OUTPUTS_DIR = path.join(PUBLIC_DIR, 'outputs')
const MODELS_JSON_PATH = path.join(PUBLIC_DIR, 'models.json')

function safeMkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function listModelDirs(outputsDir) {
  if (!fs.existsSync(outputsDir)) return []
  const entries = fs.readdirSync(outputsDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => name && !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b))
}

function syncOutputsToPublic(modelNames) {
  safeMkdirp(PUBLIC_OUTPUTS_DIR)

  for (const name of modelNames) {
    const srcDir = path.join(OUTPUTS_DIR, name)
    const destDir = path.join(PUBLIC_OUTPUTS_DIR, name)

    // Node 18+: copy directory recursively
    fs.cpSync(srcDir, destDir, {
      recursive: true,
      force: true,
      errorOnExist: false,
    })
  }
}

function writeModelsJson(modelNames) {
  safeMkdirp(PUBLIC_DIR)

  const models = modelNames.map((name) => ({
    name,
    path: `/outputs/${name}/index.html`,
  }))

  fs.writeFileSync(MODELS_JSON_PATH, JSON.stringify(models, null, 2) + '\n', 'utf8')
}

try {
  const modelNames = listModelDirs(OUTPUTS_DIR)
  syncOutputsToPublic(modelNames)
  writeModelsJson(modelNames)
} catch (err) {
  // Hard fallback: empty list (keeps build from failing)
  try {
    safeMkdirp(PUBLIC_DIR)
    fs.writeFileSync(MODELS_JSON_PATH, '[]\n', 'utf8')
  } catch {
    // ignore
  }

  console.error('[gen-sidebar] Failed to generate models.json:', err)
  process.exitCode = 0
}
