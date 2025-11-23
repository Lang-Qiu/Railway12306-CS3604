/* eslint-disable */
const path = require('path')
const fs = require('fs')

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pad(n) { return String(n).padStart(2, '0') }
function fmtTime(min) { const h = Math.floor(min / 60); const m = min % 60; return `${pad(h)}:${pad(m)}` }

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '..', 'database', 'railway.db')
let DatabaseModule
try { DatabaseModule = require('better-sqlite3') } catch (_) { DatabaseModule = null }
let sqlite3
try { sqlite3 = require('sqlite3').verbose() } catch (_) { sqlite3 = null }

function getDb() {
  if (DatabaseModule) {
    try { return new DatabaseModule(DB_PATH) } catch (_) { /* fallback */ }
  }
  if (sqlite3) {
    const db = new sqlite3.Database(DB_PATH)
    // Wrap run/all in sync-like helpers for simple usage
    return {
      exec(sql) { return new Promise((resolve, reject) => db.exec(sql, (e) => e ? reject(e) : resolve())) },
      prepare(sql) {
        const stmt = db.prepare(sql)
        return {
          run(...params) { return new Promise((resolve, reject) => stmt.run(params, function (e) { e ? reject(e) : resolve(this) })) },
        }
      },
      close() { db.close() },
    }
  }
  throw new Error('No sqlite driver available')
}

async function main() {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = getDb()

  const createSql = `
  CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_no TEXT UNIQUE NOT NULL,
    train_type TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    planned_duration_min INTEGER NOT NULL,
    business_price REAL,
    first_class_price REAL,
    second_class_price REAL,
    no_seat_price REAL
  );
  CREATE INDEX IF NOT EXISTS idx_trains_origin_dest ON trains(origin, destination);
  `

  if (db.exec) {
    await db.exec('DROP TABLE IF EXISTS trains;')
    await db.exec(createSql)
  } else {
    db.exec('DROP TABLE IF EXISTS trains;')
    db.exec(createSql)
  }

  const stations = [
    '北京','北京西','北京南','上海','上海虹桥','广州','深圳','杭州','南京','苏州',
    '天津','重庆','成都','西安','武汉','郑州','长沙','合肥','南昌','济南',
    '青岛','沈阳','大连','厦门','福州','无锡','宁波','石家庄','太原','南宁',
    '昆明','贵阳','海口','呼和浩特','乌鲁木齐','兰州','银川','西宁','长春','哈尔滨',
    '洛阳','徐州','温州','泉州','嘉兴','绍兴','台州','江门','肇庆','珠海'
  ]

  const types = [
    { key: '高铁', prefix: 'G', prices: { business: [1200, 2000], first: [600, 1000], second: [300, 600], no: [0, 0] } },
    { key: '动车', prefix: 'D', prices: { business: [0, 0], first: [300, 600], second: [150, 300], no: [120, 200] } },
    { key: '特快', prefix: 'T', prices: { business: [0, 0], first: [200, 400], second: [100, 200], no: [80, 150] } },
    { key: '普快', prefix: 'K', prices: { business: [0, 0], first: [0, 0], second: [50, 120], no: [30, 80] } },
  ]

  // Generate records
  const N = Number(process.env.TRAIN_COUNT || 500)
  const usedNos = new Set()
  const rows = []

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
  function randPrice([lo, hi]) { if (lo === 0 && hi === 0) return null; return Math.round(randInt(lo, hi) / 10) * 10 }

  for (let i = 0; i < N; i++) {
    const t = pick(types)
    // unique train number
    let trainNo
    for (;;) {
      const num = randInt(100, 9999)
      trainNo = `${t.prefix}${num}`
      if (!usedNos.has(trainNo)) { usedNos.add(trainNo); break }
    }
    // distinct stations
    let origin = pick(stations)
    let destination = pick(stations)
    let guard = 0
    while (destination === origin && guard < 10) { destination = pick(stations); guard++ }
    // time window: 05:00 to 19:30 for departure to ensure arrival same day
    const depMin = randInt(300, 1170)
    // duration between 30 and 480 minutes, but clamp to end of day
    const maxDur = (1440 - depMin) - 10
    const durMin = randInt(30, Math.min(480, Math.max(40, maxDur)))
    const arrMin = depMin + durMin
    const departureTime = fmtTime(depMin)
    const arrivalTime = fmtTime(arrMin)

    // prices
    const bp = randPrice(t.prices.business)
    const fp = randPrice(t.prices.first)
    const sp = randPrice(t.prices.second)
    const np = randPrice(t.prices.no)

    rows.push({ train_no: trainNo, train_type: t.key, origin, destination, departure_time: departureTime, arrival_time: arrivalTime, planned_duration_min: durMin, business_price: bp, first_class_price: fp, second_class_price: sp, no_seat_price: np })
  }

  // Insert
  const insertSql = `INSERT INTO trains (train_no, train_type, origin, destination, departure_time, arrival_time, planned_duration_min, business_price, first_class_price, second_class_price, no_seat_price)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  if (db.prepare) {
    const stmt = db.prepare(insertSql)
    for (const r of rows) { if (stmt.run(r.train_no, r.train_type, r.origin, r.destination, r.departure_time, r.arrival_time, r.planned_duration_min, r.business_price, r.first_class_price, r.second_class_price, r.no_seat_price)) {} }
  } else {
    const stmt = db.prepare(insertSql)
    for (const r of rows) { await stmt.run(r.train_no, r.train_type, r.origin, r.destination, r.departure_time, r.arrival_time, r.planned_duration_min, r.business_price, r.first_class_price, r.second_class_price, r.no_seat_price) }
  }

  // Verification summary
  const distinctCount = usedNos.size
  console.log('[DB GENERATOR] Path:', DB_PATH)
  console.log('[DB GENERATOR] Inserted rows:', rows.length)
  console.log('[DB GENERATOR] Distinct train_no:', distinctCount)
  console.log('[DB GENERATOR] Example row:', rows[0])

  if (db.close) db.close()
}

main().catch((e) => { console.error('Generation failed:', e); process.exit(1) })