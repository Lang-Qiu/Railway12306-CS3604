const fs = require('fs')
const path = require('path')

function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g,'').replace(/站$/,'').replace(/市$/,'') }
function loadSynonyms() {
  try { const p = path.resolve(__dirname, 'stationSynonyms.json'); const raw = fs.readFileSync(p, 'utf-8'); return JSON.parse(raw) } catch { return {} }
}
const SYN = loadSynonyms()

function expand(name) {
  const n = norm(name)
  const keys = Object.keys(SYN)
  for (const k of keys) { const nk = norm(k); if (n === nk || n.includes(nk) || nk.includes(n)) return [nk, ...SYN[k].map(x=>norm(x))] }
  return [n]
}

function distance(a,b) {
  const s1 = norm(a), s2 = norm(b)
  const m = Array(s1.length+1).fill(0).map(()=>Array(s2.length+1).fill(0))
  for(let i=0;i<=s1.length;i++) m[i][0]=i
  for(let j=0;j<=s2.length;j++) m[0][j]=j
  for(let i=1;i<=s1.length;i++) for(let j=1;j<=s2.length;j++) {
    const cost = s1[i-1]===s2[j-1]?0:1
    m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+cost)
  }
  return m[s1.length][s2.length]
}

function scoreStation(query, target) {
  const nq = norm(query), nt = norm(target)
  if (nq === nt) return 1.0
  if (nt.includes(nq) || nq.includes(nt)) return 0.9
  const d = distance(nq, nt)
  if (d <= 1) return 0.85
  if (d === 2) return 0.7
  return 0
}

function scoreRoute(fromQ, toQ, route) {
  const sFrom = Math.max(...expand(fromQ).map(x=>scoreStation(x, route.origin)))
  const sTo = Math.max(...expand(toQ).map(x=>scoreStation(x, route.destination)))
  const base = (sFrom + sTo) / 2
  return base
}

function rank(list, from, to) {
  const out = list.map((t)=>{
    const sc = scoreRoute(from, to, t.route || {})
    const hs = String(t.train_no || '').startsWith('G') || String(t.train_no || '').startsWith('D') ? 0.05 : 0
    const dur = typeof (t.route?.planned_duration_min) === 'number' ? t.route.planned_duration_min : 240
    const durScore = dur <= 240 ? 0.05 : 0
    return { item: t, score: sc + hs + durScore }
  })
  const filtered = out.filter(x=>x.score >= 0.6)
  filtered.sort((a,b)=> b.score - a.score)
  return filtered.map(x=>x.item)
}

module.exports = { rank }