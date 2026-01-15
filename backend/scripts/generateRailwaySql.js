/* eslint-disable */
const fs = require('fs')
const path = require('path')

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pad(n) { return String(n).padStart(2, '0') }
function fmtTime(min) { const h = Math.floor(min / 60); const m = min % 60; return `${pad(h)}:${pad(m)}` }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randPrice([lo, hi]) { if (lo === 0 && hi === 0) return 'NULL'; return Math.round(randInt(lo, hi) / 10) * 10 }

const OUT_DIR = path.resolve(__dirname, '..', 'database', 'seed')
const OUT_SQL = path.join(OUT_DIR, 'trains.sql')
fs.mkdirSync(OUT_DIR, { recursive: true })

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

const N = Number(process.env.TRAIN_COUNT || 500)
const usedNos = new Set()
const rows = []

for (let i = 0; i < N; i++) {
  const t = pick(types)
  let trainNo
  for (;;) {
    const num = randInt(100, 9999)
    trainNo = `${t.prefix}${num}`
    if (!usedNos.has(trainNo)) { usedNos.add(trainNo); break }
  }
  let origin = pick(stations)
  let destination = pick(stations)
  let guard = 0
  while (destination === origin && guard < 10) { destination = pick(stations); guard++ }
  const depMin = randInt(300, 1170)
  const maxDur = (1440 - depMin) - 10
  const durMin = randInt(30, Math.min(480, Math.max(40, maxDur)))
  const arrMin = depMin + durMin
  const departureTime = fmtTime(depMin)
  const arrivalTime = fmtTime(arrMin)
  const bp = randPrice(t.prices.business)
  const fp = randPrice(t.prices.first)
  const sp = randPrice(t.prices.second)
  const np = randPrice(t.prices.no)
  rows.push({ train_no: trainNo, train_type: t.key, origin, destination, departure_time: departureTime, arrival_time: arrivalTime, planned_duration_min: durMin, business_price: bp, first_class_price: fp, second_class_price: sp, no_seat_price: np })
}

let ddl = ''
ddl += 'BEGIN TRANSACTION;\n'
ddl += 'DROP TABLE IF EXISTS trains;\n'
ddl += 'CREATE TABLE IF NOT EXISTS trains (\n'
ddl += '  id INTEGER PRIMARY KEY AUTOINCREMENT,\n'
ddl += '  train_no TEXT UNIQUE NOT NULL,\n'
ddl += '  train_type TEXT NOT NULL,\n'
ddl += '  origin TEXT NOT NULL,\n'
ddl += '  destination TEXT NOT NULL,\n'
ddl += '  departure_time TEXT NOT NULL,\n'
ddl += '  arrival_time TEXT NOT NULL,\n'
ddl += '  planned_duration_min INTEGER NOT NULL,\n'
ddl += '  business_price REAL,\n'
ddl += '  first_class_price REAL,\n'
ddl += '  second_class_price REAL,\n'
ddl += '  no_seat_price REAL\n'
ddl += ');\n'
ddl += 'CREATE INDEX IF NOT EXISTS idx_trains_origin_dest ON trains(origin, destination);\n'
ddl += 'CREATE INDEX IF NOT EXISTS idx_trains_origin_dest_nocase ON trains(origin COLLATE NOCASE, destination COLLATE NOCASE);\n'

const insertHead = 'INSERT INTO trains (train_no, train_type, origin, destination, departure_time, arrival_time, planned_duration_min, business_price, first_class_price, second_class_price, no_seat_price) VALUES '
const values = rows.map(r => `('${r.train_no}','${r.train_type}','${r.origin}','${r.destination}','${r.departure_time}','${r.arrival_time}',${r.planned_duration_min},${r.business_price},${r.first_class_price},${r.second_class_price},${r.no_seat_price})`)
ddl += insertHead + values.join(',\n') + ';\n'
ddl += 'COMMIT;\n'

fs.writeFileSync(OUT_SQL, ddl, 'utf-8')
console.log('[SQL GENERATOR] Wrote seed SQL:', OUT_SQL)
console.log('[SQL GENERATOR] Rows:', rows.length)
console.log('[SQL GENERATOR] Example:', rows[0])