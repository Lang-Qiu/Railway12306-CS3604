import React, { useState } from 'react'
import '../styles/trains.css'

type Props = {
  options?: { types?: string[]; origins?: string[]; destinations?: string[]; seatTypes?: string[] }
  value?: { types?: string[]; origins?: string[]; destinations?: string[]; seatTypes?: string[] }
  onChange?: (v: { types?: string[]; origins?: string[]; destinations?: string[]; seatTypes?: string[] }) => void
}

const TrainFilterBar: React.FC<Props> = ({ options, value, onChange }) => {
  const types = options?.types || ['GC', 'D']
  const selectedTypes = new Set(value?.types || [])
  const selectedOrigins = new Set(value?.origins || [])
  const selectedDestinations = new Set(value?.destinations || [])
  const selectedSeatTypes = new Set(value?.seatTypes || [])
  const toggleTypes = (key: string) => {
    const next = new Set(selectedTypes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange?.({ types: Array.from(next) })
  }
  const toggleOrigins = (key: string) => {
    const next = new Set(selectedOrigins)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange?.({ origins: Array.from(next) })
  }
  const toggleDestinations = (key: string) => {
    const next = new Set(selectedDestinations)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange?.({ destinations: Array.from(next) })
  }
  const toggleSeatTypes = (key: string) => {
    const next = new Set(selectedSeatTypes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange?.({ seatTypes: Array.from(next) })
  }
  const [collapsed, setCollapsed] = useState<{ [k: string]: boolean }>({ types: false, origins: false, destinations: false, seatTypes: false })
  const toggleCollapse = (key: 'types' | 'origins' | 'destinations' | 'seatTypes') => {
    setCollapsed((p) => ({ ...p, [key]: !p[key] }))
  }
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [timeRange, setTimeRange] = useState('00:00~24:00')
  return (
    <div className={`trains-filter${panelCollapsed ? ' collapsed' : ''}`}>
      <div className="filter-row">
        <span className="filter-label">车次类型:</span>
        <button type="button" className="tag-all">全部</button>
        {types.includes('GC') && (
          <label className="filter-item"><input type="checkbox" aria-label="GC-高铁/城际" checked={selectedTypes.has('GC')} onChange={() => toggleTypes('GC')} />GC-高铁/城际</label>
        )}
        {types.includes('D') && (
          <label className="filter-item"><input type="checkbox" aria-label="D-动车" checked={selectedTypes.has('D')} onChange={() => toggleTypes('D')} />D-动车</label>
        )}
        <label className="filter-item disabled"><input type="checkbox" disabled />Z-直达</label>
        <label className="filter-item disabled"><input type="checkbox" disabled />T-特快</label>
        <label className="filter-item disabled"><input type="checkbox" disabled />K-快速</label>
        <label className="filter-item disabled"><input type="checkbox" disabled />其他</label>
        <label className="filter-item disabled"><input type="checkbox" disabled />复兴号</label>
        <label className="filter-item disabled"><input type="checkbox" disabled />智能动车组</label>
        <div className="filter-extra">
          <span className="filter-time-label">发车时间:</span>
          <select className="time-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option>00:00~24:00</option>
            <option>06:00~12:00</option>
            <option>12:00~18:00</option>
            <option>18:00~24:00</option>
          </select>
        </div>
      </div>
      {!panelCollapsed && (
        <>
          <div className="filter-row">
            <span className="filter-label">出发车站:</span>
            <button type="button" className="tag-all">全部</button>
            {(options?.origins || []).map((o) => (
              <label key={`o-${o}`} className="filter-item"><input type="checkbox" aria-label={`origin-${o}`} checked={selectedOrigins.has(o)} onChange={() => toggleOrigins(o)} />{o}</label>
            ))}
          </div>
          <div className="filter-row">
            <span className="filter-label">到达车站:</span>
            <button type="button" className="tag-all">全部</button>
            {(options?.destinations || []).map((d) => (
              <label key={`d-${d}`} className="filter-item"><input type="checkbox" aria-label={`destination-${d}`} checked={selectedDestinations.has(d)} onChange={() => toggleDestinations(d)} />{d}</label>
            ))}
          </div>
          <div className="filter-row">
            <span className="filter-label">车次席别:</span>
            <button type="button" className="tag-all">全部</button>
            {(options?.seatTypes || []).map((s) => (
              <label key={`s-${s}`} className="filter-item"><input type="checkbox" aria-label={`seat-${s}`} checked={selectedSeatTypes.has(s)} onChange={() => toggleSeatTypes(s)} />{s}</label>
            ))}
            <label className="filter-item disabled"><input type="checkbox" disabled />硬座</label>
          </div>
        </>
      )}
      <button type="button" className="filter-toggle" onClick={() => setPanelCollapsed((v) => !v)}>{panelCollapsed ? '筛选 ▲' : '筛选 ▼'}</button>
    </div>
  )
}

export default TrainFilterBar