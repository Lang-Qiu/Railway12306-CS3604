let stats = { total: 0, empty: 0, fuzzyUsed: 0 }
function inc(k) { stats[k] = (stats[k] || 0) + 1 }
function mark(totalBefore, listLen) { inc('total'); if (listLen === 0) inc('empty') }
function markFuzzy() { inc('fuzzyUsed') }
function snapshot() { return { ...stats } }
module.exports = { mark, markFuzzy, snapshot }