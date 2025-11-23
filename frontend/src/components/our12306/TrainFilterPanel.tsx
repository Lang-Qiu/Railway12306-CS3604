import React, { useState, useEffect } from 'react'
import './TrainFilterPanel.css'

type Props = {
  onFilterChange: (filters: any) => void
  departureStations: string[]
  arrivalStations: string[]
  seatTypes: string[]
  departureDate?: string
}

const TrainFilterPanel: React.FC<Props> = ({ onFilterChange, departureStations, arrivalStations, seatTypes: _seatTypes, departureDate }) => {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<string[]>([])
  const [selectedDepartureStations, setSelectedDepartureStations] = useState<string[]>([])
  const [selectedArrivalStations, setSelectedArrivalStations] = useState<string[]>([])
  const [selectedSeatTypes, setSelectedSeatTypes] = useState<string[]>([])
  const [departureTimeRange, setDepartureTimeRange] = useState<string>('00:00--24:00')

  useEffect(() => { if (departureDate) setSelectedDate(departureDate) }, [departureDate])

  const dateTabs = (() => {
    const tabs: { date: string; display: string; weekDay: string }[] = []
    const base = departureDate ? new Date(departureDate) : new Date()
    let i = -1
    while (i <= 14) {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const mm = d.getMonth() + 1
      const dd = d.getDate()
      const wd = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
      tabs.push({ date: ds, display: `${mm}-${dd}`, weekDay: wd })
      i += 1
    }
    return tabs
  })()

  const trainTypeOptions = [
    { key: 'GC', label: 'GC-高铁/城际', types: ['G','C'] },
    { key: 'D', label: 'D-动车', types: ['D'] },
    { key: 'Z', label: 'Z-直达', types: ['Z'] },
    { key: 'T', label: 'T-特快', types: ['T'] },
    { key: 'K', label: 'K-快速', types: ['K'] },
    { key: 'OTHER', label: '其他', types: ['OTHER'] },
    { key: 'FUXING', label: '复兴号', types: ['FUXING'] },
    { key: 'SMART', label: '智能动车组', types: ['SMART'] },
  ]
  const seatTypeOptions = ['商务座','一等座','二等座','软卧','软座','二等卧','一等卧','硬卧','硬座']

  const trigger = (updates: any) => {
    onFilterChange({
      trainTypes: updates.trainTypes !== undefined ? updates.trainTypes : selectedTrainTypes,
      departureStations: updates.departureStations !== undefined ? updates.departureStations : selectedDepartureStations,
      arrivalStations: updates.arrivalStations !== undefined ? updates.arrivalStations : selectedArrivalStations,
      seatTypes: updates.seatTypes !== undefined ? updates.seatTypes : selectedSeatTypes,
      departureTimeRange: updates.departureTimeRange !== undefined ? updates.departureTimeRange : departureTimeRange,
    })
  }

  const toggleTypes = (types: string[]) => {
    let nt = [...selectedTrainTypes]
    const all = types.every((t) => nt.includes(t))
    nt = all ? nt.filter((t) => !types.includes(t)) : Array.from(new Set([...nt, ...types]))
    setSelectedTrainTypes(nt)
    trigger({ trainTypes: nt })
  }

  return (
    <div className="train-filter-panel">
      <div className="date-filter-tabs">
        {dateTabs.map((tab) => (
          <button key={tab.date} className={`date-tab ${selectedDate === tab.date ? 'active' : ''}`} onClick={() => setSelectedDate(tab.date)}>
            <div className="date-tab-date">{tab.display}</div>
          </button>
        ))}
      </div>
      <div className="filter-panel-container">
        <div className="filter-row">
          <div className="filter-label">车次类型：</div>
          <button className="filter-all-btn" onClick={() => { const all = trainTypeOptions.flatMap((o) => o.types); const useAll = selectedTrainTypes.length !== all.length; setSelectedTrainTypes(useAll ? all : []); trigger({ trainTypes: useAll ? all : [] }) }}>全部</button>
          <div className="filter-options">
            {trainTypeOptions.map((o) => (
              <label key={o.key} className="filter-checkbox">
                <input type="checkbox" checked={o.types.every((t) => selectedTrainTypes.includes(t))} onChange={() => toggleTypes(o.types)} />
                <span className="checkbox-label">{o.label}</span>
              </label>
            ))}
          </div>
          <div className="filter-time-select">
            <span className="time-label">发车时间：</span>
            <select value={departureTimeRange} onChange={(e) => { const v = e.target.value; setDepartureTimeRange(v); trigger({ departureTimeRange: v }) }} className="time-dropdown">
              <option value="00:00--24:00">00:00--24:00</option>
              <option value="00:00--06:00">00:00--06:00</option>
              <option value="06:00--12:00">06:00--12:00</option>
              <option value="12:00--18:00">12:00--18:00</option>
              <option value="18:00--24:00">18:00--24:00</option>
            </select>
          </div>
        </div>
        {departureStations.length > 0 && (
          <div className="filter-row">
            <div className="filter-label">出发车站：</div>
            <button className="filter-all-btn" onClick={() => { const useAll = selectedDepartureStations.length !== departureStations.length; const next = useAll ? [...departureStations] : []; setSelectedDepartureStations(next); trigger({ departureStations: next }) }}>全选</button>
            <div className="filter-options">
              {departureStations.map((s) => (
                <label key={s} className="filter-checkbox">
                  <input type="checkbox" checked={selectedDepartureStations.includes(s)} onChange={() => { const next = selectedDepartureStations.includes(s) ? selectedDepartureStations.filter((x) => x !== s) : [...selectedDepartureStations, s]; setSelectedDepartureStations(next); trigger({ departureStations: next }) }} />
                  <span className="checkbox-label">{s}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {arrivalStations.length > 0 && (
          <div className="filter-row">
            <div className="filter-label">到达车站：</div>
            <button className="filter-all-btn" onClick={() => { const useAll = selectedArrivalStations.length !== arrivalStations.length; const next = useAll ? [...arrivalStations] : []; setSelectedArrivalStations(next); trigger({ arrivalStations: next }) }}>全选</button>
            <div className="filter-options">
              {arrivalStations.map((s) => (
                <label key={s} className="filter-checkbox">
                  <input type="checkbox" checked={selectedArrivalStations.includes(s)} onChange={() => { const next = selectedArrivalStations.includes(s) ? selectedArrivalStations.filter((x) => x !== s) : [...selectedArrivalStations, s]; setSelectedArrivalStations(next); trigger({ arrivalStations: next }) }} />
                  <span className="checkbox-label">{s}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="filter-row">
          <div className="filter-label">车次席别：</div>
          <button className="filter-all-btn" onClick={() => { const useAll = selectedSeatTypes.length !== seatTypeOptions.length; const next = useAll ? [...seatTypeOptions] : []; setSelectedSeatTypes(next); trigger({ seatTypes: next }) }}>全选</button>
          <div className="filter-options">
            {seatTypeOptions.map((t) => (
              <label key={t} className="filter-checkbox">
                <input type="checkbox" checked={selectedSeatTypes.includes(t)} onChange={() => { const next = selectedSeatTypes.includes(t) ? selectedSeatTypes.filter((x) => x !== t) : [...selectedSeatTypes, t]; setSelectedSeatTypes(next); trigger({ seatTypes: next }) }} />
                <span className="checkbox-label">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="filter-summary">
          <button className="clear-filters-btn" onClick={() => { setSelectedTrainTypes([]); setSelectedDepartureStations([]); setSelectedArrivalStations([]); setSelectedSeatTypes([]); trigger({ trainTypes: [], departureStations: [], arrivalStations: [], seatTypes: [] }) }}>
            <span className="clear-icon">▼</span> 筛选
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainFilterPanel