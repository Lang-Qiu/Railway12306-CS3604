function diffLists(a = [], b = []) {
  const setA = new Set(a.map(x => x.trainNumber || x.train_no))
  const setB = new Set(b.map(x => x.trainNumber || x.train_no))
  const onlyA = [...setA].filter(k => !setB.has(k))
  const onlyB = [...setB].filter(k => !setA.has(k))
  return { onlyOfficial: onlyA, onlyBackup: onlyB }
}

module.exports = { diffLists }