class Metrics {
  constructor() {
    this.hist = []
    this.errors = 0
    this.total = 0
    this.lastUpdate = 0
  }
  observe(durationMs, ok = true) {
    this.total += 1
    if (!ok) this.errors += 1
    this.hist.push(durationMs)
    this.lastUpdate = Date.now()
    if (this.hist.length > 10000) this.hist.splice(0, this.hist.length - 10000)
  }
  p99() {
    if (this.hist.length === 0) return 0
    const arr = [...this.hist].sort((a,b)=>a-b)
    const idx = Math.max(0, Math.floor(arr.length*0.99)-1)
    return arr[idx]
  }
  snapshot() {
    return { total: this.total, errors: this.errors, errorRate: this.total ? (this.errors/this.total) : 0, p99: this.p99(), lastUpdate: this.lastUpdate }
  }
}

module.exports = new Metrics()