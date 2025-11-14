import React, { useEffect, useMemo, useState } from 'react'
import './StationPicker.css'

type Props = {
  style: React.CSSProperties
  onSelect: (name: string) => void
  onClose: () => void
}

type Station = { name: string; pinyin: string }

const alphaGroups = ['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXYZ']

async function loadStations(): Promise<Station[]> {
  try {
    const res = await fetch('/station_name.js')
    const txt = await res.text()
    const match = txt.match(/var\s+station_names\s*=\s*'([^']+)'/)
    const raw = match ? match[1] : ''
    const items = raw.split('@').filter(Boolean)
    return items.map((s) => {
      const parts = s.split('|')
      return { name: parts[1], pinyin: parts[3] }
    })
  } catch {
    return []
  }
}

function groupByInitial(list: Station[]) {
  const map: Record<string, string[]> = {}
  for (const s of list) {
    const initial = (s.pinyin?.[0] || '').toUpperCase()
    if (!initial) continue
    if (!map[initial]) map[initial] = []
    map[initial].push(s.name)
  }
  for (const k of Object.keys(map)) map[k] = Array.from(new Set(map[k])).sort()
  return map
}

const StationPicker: React.FC<Props> = ({ style, onSelect, onClose }) => {
  const [stations, setStations] = useState<Station[]>([])
  const [activeTab, setActiveTab] = useState<string>('ABCDE')
  const [pageIndex, setPageIndex] = useState<number>(0)

  useEffect(() => {
    loadStations().then(setStations)
  }, [])

  const grouped = useMemo(() => groupByInitial(stations), [stations])

  const renderGroup = (letters: string) => {
    const start = pageIndex * 12
    const visibleLetters = letters
      .split('')
      .filter((ch) => {
        const arr = grouped[ch] || []
        return arr.slice(start, start + 12).length > 0
      })
    return (
      <div className="sp-list">
        {visibleLetters.map((ch) => {
          const arr = grouped[ch] || []
          const slice = arr.slice(start, start + 12)
          const rows = [slice.slice(0, 6), slice.slice(6, 12)]
          return (
            <div key={ch} className="sp-row">
              <span className="sp-letter">{ch}</span>
              <div className="sp-items">
                {rows[0].map((name) => (
                  <button key={ch + name} className="sp-item" onClick={() => onSelect(name)}>{name}</button>
                ))}
                {Array.from({ length: Math.max(0, 6 - rows[0].length) }).map((_, i) => (
                  <span key={ch + 'p0' + i} className="sp-item placeholder" />
                ))}
                {rows[1].map((name) => (
                  <button key={ch + name + 'r'} className="sp-item" onClick={() => onSelect(name)}>{name}</button>
                ))}
                {Array.from({ length: Math.max(0, 6 - rows[1].length) }).map((_, i) => (
                  <span key={ch + 'p1' + i} className="sp-item placeholder" />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const hasPrev = pageIndex > 0
  const hasNext = useMemo(() => {
    return activeTab.split('').some((ch) => {
      const arr = grouped[ch] || []
      return arr.length > (pageIndex + 1) * 12
    })
  }, [activeTab, grouped, pageIndex])

  return (
    <div className="station-picker" style={style}>
      <div className="sp-header">
        <div className="sp-title">拼音支持首字母输入</div>
        <button className="sp-close" onClick={onClose}>×</button>
      </div>
      <div className="sp-tabs">
        {alphaGroups.map((g) => (
          <button key={g} className={activeTab === g ? 'sp-tab active' : 'sp-tab'} onClick={() => { setActiveTab(g); setPageIndex(0) }}>
            {g}
          </button>
        ))}
      </div>
      {renderGroup(activeTab)}
      <div className="sp-pagination">
        <button className={hasPrev ? 'sp-page' : 'sp-page disabled'} onClick={() => hasPrev && setPageIndex((p) => Math.max(0, p - 1))}>&laquo; 上一页</button>
        <span className="sp-sep">|</span>
        <button className={hasNext ? 'sp-page' : 'sp-page disabled'} onClick={() => hasNext && setPageIndex((p) => p + 1)}>下一页 &raquo;</button>
      </div>
    </div>
  )
}

export default StationPicker
