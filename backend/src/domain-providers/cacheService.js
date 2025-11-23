const Redis = (() => { try { return require('redis'); } catch (_) { return null } })()

class MemoryCache {
  constructor() { this.store = new Map() }
  set(key, value, ttlMs) {
    const expiresAt = Date.now() + (ttlMs || 0)
    this.store.set(key, { value, expiresAt })
  }
  get(key) {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) { this.store.delete(key); return null }
    return entry.value
  }
  del(key) { this.store.delete(key) }
}

class CacheService {
  constructor() {
    this.mem = new MemoryCache()
    this.redis = null
    const url = process.env.REDIS_URL
    if (Redis && url) {
      try {
        this.redis = Redis.createClient({ url })
        this.redis.on('error', (err) => console.error('Redis error', err))
        this.redis.connect().catch(() => { this.redis = null })
      } catch (_) { this.redis = null }
    }
  }

  async get(key) {
    const m = this.mem.get(key)
    if (m !== null && m !== undefined) return m
    if (this.redis) {
      try { const raw = await this.redis.get(key); return raw ? JSON.parse(raw) : null } catch (_) { return null }
    }
    return null
  }

  async set(key, value, ttlMemMs = 300000, ttlRedisSec = 1800) {
    this.mem.set(key, value, ttlMemMs)
    if (this.redis) {
      try { await this.redis.set(key, JSON.stringify(value), { EX: ttlRedisSec }) } catch (_) {}
    }
  }

  async del(key) {
    this.mem.del(key)
    if (this.redis) {
      try { await this.redis.del(key) } catch (_) {}
    }
  }
}

module.exports = new CacheService()