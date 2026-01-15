const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const SRC_ROOT = path.resolve(__dirname, '..', 'src')

const mapping = {
  'config': 'infra-config',
  'constants': 'message-catalog',
  'controllers': 'request-handlers',
  'middleware': 'request-interceptors',
  'routes': 'route-manifests',
  'services': 'domain-providers',
}

function log(msg) {
  process.stdout.write(`${msg}\n`)
}

function writeChangeLog(items) {
  const outPath = path.resolve(__dirname, 'rename-log.json')
  const payload = {
    timestamp: new Date().toISOString(),
    items,
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8')
}

function writeMappingTable() {
  const outPath = path.resolve(__dirname, 'folder-mapping.json')
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf-8')
}

function tryGitMv(oldDir, newDir) {
  try {
    const r = cp.spawnSync('git', ['mv', oldDir, newDir], { stdio: 'pipe' })
    if (r.status === 0) return true
    return false
  } catch (_) {
    return false
  }
}

function safeRename(oldDir, newDir) {
  if (!fs.existsSync(oldDir)) return { ok: false, error: 'missing' }
  const parent = path.dirname(newDir)
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true })
  if (tryGitMv(oldDir, newDir)) return { ok: true, via: 'git' }
  try {
    fs.renameSync(oldDir, newDir)
    return { ok: true, via: 'fs' }
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) }
  }
}

function replaceInFile(file, replacers) {
  const src = fs.readFileSync(file, 'utf-8')
  let out = src
  for (const [from, to] of replacers) {
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    out = out.replace(re, to)
  }
  if (out !== src) fs.writeFileSync(file, out, 'utf-8')
}

function collectJsFiles(dir) {
  const out = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const it of items) {
    const p = path.join(dir, it.name)
    if (it.isDirectory()) out.push(...collectJsFiles(p))
    else if (it.isFile() && p.endsWith('.js')) out.push(p)
  }
  return out
}

function run() {
  writeMappingTable()
  const changes = []
  // 1) rename folders
  for (const [oldName, newName] of Object.entries(mapping)) {
    const oldDir = path.join(SRC_ROOT, oldName)
    const newDir = path.join(SRC_ROOT, newName)
    if (!fs.existsSync(oldDir)) continue
    const res = safeRename(oldDir, newDir)
    changes.push({ old: oldDir, proposed: newDir, status: res.ok ? 'renamed' : 'skipped', method: res.via || 'none', error: res.error || null })
    log(`${res.ok ? 'RENAMED' : 'SKIPPED'} ${oldDir} -> ${newDir} ${res.via ? '('+res.via+')' : ''} ${res.error ? '- '+res.error : ''}`)
  }

  // 2) update references in src js files
  const files = collectJsFiles(SRC_ROOT)
  const replacers = [
    ['./routes/', './route-manifests/'],
    ['../routes/', '../route-manifests/'],
    ['../controllers/', '../request-handlers/'],
    ['./controllers/', './request-handlers/'],
    ['../middleware/', '../request-interceptors/'],
    ['./middleware/', './request-interceptors/'],
    ['../services/', '../domain-providers/'],
    ['./services/', './domain-providers/'],
    ['../constants/', '../message-catalog/'],
    ['./constants/', './message-catalog/'],
    ['../config/', '../infra-config/'],
    ['./config/', './infra-config/'],
  ]
  for (const f of files) replaceInFile(f, replacers)
  writeChangeLog(changes)
}

if (require.main === module) run()