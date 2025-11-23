const axios = (() => { try { return require('axios'); } catch (_) { return null } })()
const cache = require('./cacheService')

const CONFIG = {
  baseURL: process.env.OFFICIAL_API_BASE || 'https://api.12306.cn',
  tokenURL: process.env.OFFICIAL_AUTH_TOKEN_URL || 'https://api.12306.cn/oauth/token',
  clientId: process.env.OFFICIAL_CLIENT_ID || '',
  clientSecret: process.env.OFFICIAL_CLIENT_SECRET || '',
  useMock: process.env.OFFICIAL_USE_MOCK === '1',
  rateLimitQps: Number(process.env.OFFICIAL_RATE_LIMIT_QPS || '20'),
}

let tokenCache = { accessToken: null, expiresAt: 0 }

async function getAccessToken() {
  if (CONFIG.useMock) return 'mock-token'
  if (!axios) throw new Error('axios not available')
  const now = Date.now()
  if (tokenCache.accessToken && tokenCache.expiresAt - 60000 > now) return tokenCache.accessToken
  const params = new URLSearchParams()
  params.set('grant_type', 'client_credentials')
  params.set('client_id', CONFIG.clientId)
  params.set('client_secret', CONFIG.clientSecret)
  const res = await axios.post(CONFIG.tokenURL, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  const { access_token, expires_in } = res.data
  tokenCache = { accessToken: access_token, expiresAt: now + (expires_in * 1000) }
  return tokenCache.accessToken
}

function normalize(item) {
  const route = item.route || {}
  const durationMin = route.planned_duration_min
  const duration = typeof durationMin === 'number' ? `${Math.floor(durationMin / 60)}小时${durationMin % 60}分` : ''
  return {
    id: item.train_no,
    trainNumber: item.train_no,
    departure: route.origin,
    arrival: route.destination,
    departureTime: route.departure_time,
    arrivalTime: route.arrival_time,
    duration,
    businessSeat: item.fares?.business || 0,
    firstClassSeat: item.fares?.first_class || 0,
    secondClassSeat: item.fares?.second_class || 0,
    softSleeperSeat: item.fares?.soft_sleeper || 0,
    hardSleeperSeat: item.fares?.hard_sleeper || 0,
    businessPrice: item.fares?.business || 0,
    firstClassPrice: item.fares?.first_class || 0,
    secondClassPrice: item.fares?.second_class || 0,
    softSleeperPrice: item.fares?.soft_sleeper || 0,
    hardSleeperPrice: item.fares?.hard_sleeper || 0,
  }
}

async function mockSearch({ from, to, date, highspeed }) {
  const samples = [
    { train_no: 'G101', train_type: '高速动车', route: { origin: '北京', destination: '上海', departure_time: '06:10', arrival_time: '12:09', planned_duration_min: 359 }, fares: { business: 0, first_class: 560, second_class: 350 } },
    { train_no: 'D221', train_type: '动车', route: { origin: '北京', destination: '上海', departure_time: '07:40', arrival_time: '14:20', planned_duration_min: 400 }, fares: { first_class: 480, second_class: 300 } },
  ]
  const list = samples.filter(s => s.route.origin === from && s.route.destination === to)
  return list.map(normalize)
}

async function searchTrains({ from, to, date, highspeed }) {
  const cacheKey = `official:search:${from}:${to}:${date}:${highspeed || '-'}`
  const cached = await cache.get(cacheKey)
  if (cached) return cached
  if (CONFIG.useMock) { const out = await mockSearch({ from, to, date, highspeed }); await cache.set(cacheKey, out); return out }
  if (!axios) throw new Error('axios not available')
  const token = await getAccessToken()
  const url = `${CONFIG.baseURL}/trains/search`
  tryConsume()
  const res = await axios.get(url, { params: { from, to, date, highspeed }, headers: { Authorization: `Bearer ${token}` } })
  const rows = Array.isArray(res.data?.trains) ? res.data.trains : []
  const out = rows.map(normalize)
  await cache.set(cacheKey, out)
  return out
}

module.exports = { searchTrains }
let bucket = { tokens: CONFIG.rateLimitQps, last: Date.now() }
function tryConsume() {
  const now = Date.now()
  if (now - bucket.last >= 1000) { bucket.tokens = CONFIG.rateLimitQps; bucket.last = now }
  if (bucket.tokens <= 0) throw new Error('official_api_rate_limited')
  bucket.tokens -= 1
}