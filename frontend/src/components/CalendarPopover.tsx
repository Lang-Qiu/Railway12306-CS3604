import React, { useEffect, useMemo, useState } from 'react'
import './CalendarPopover.css'

type Props = {
  style: React.CSSProperties
  value?: string
  onSelect: (dateStr: string) => void
  onClose: () => void
}

function fmt(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number) {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

const WEEK = ['日','一','二','三','四','五','六']

function monthMatrix(year: number, monthIdx: number) {
  const first = new Date(year, monthIdx, 1)
  const days = new Date(year, monthIdx + 1, 0).getDate()
  const startW = first.getDay()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startW; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, monthIdx, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

const CalendarPopover: React.FC<Props> = ({ style, value, onSelect, onClose }) => {
  const today = useMemo(() => new Date(), [])
  const minDate = today
  const maxDate = addDays(today, 13)
  const init = value ? new Date(value) : today
  const [baseMonth, setBaseMonth] = useState(new Date(init.getFullYear(), init.getMonth(), 1))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.calendar-popover')) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const nextMonth = useMemo(() => new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1), [baseMonth])
  const prevEnabled = baseMonth > new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const nextEnabled = nextMonth <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  const selectable = (d: Date) => d >= new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) && d <= new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
  const isToday = (d: Date) => fmt(d) === fmt(today)

  const Panel: React.FC<{ date: Date }> = ({ date }) => {
    const y = date.getFullYear()
    const m = date.getMonth()
    const rows = monthMatrix(y, m)
    return (
      <div className="cal-panel">
        <div className="cal-head">
          <span className="cal-month">{m + 1}月</span>
          <span className="cal-year">{y}</span>
        </div>
        <div className="cal-week">
          {WEEK.map((w) => (
            <span key={w} className="cal-week-item">{w}</span>
          ))}
        </div>
        <div className="cal-grid">
          {rows.map((r, i) => (
            <div key={i} className="cal-row">
              {r.map((cell, j) => {
                if (!cell) return <span key={j} className="cal-cell empty" />
                const dis = !selectable(cell)
                const label = isToday(cell) ? '今天' : String(cell.getDate())
                return (
                  <button
                    key={j}
                    className={dis ? 'cal-cell disabled' : isToday(cell) ? 'cal-cell today' : 'cal-cell'}
                    disabled={dis}
                    onClick={() => onSelect(fmt(cell))}
                  >
                    {isToday(cell) ? (
                      <span className="label-today">{label}</span>
                    ) : (
                      <span className="label-num">{label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-popover" style={style}>
      <div className="cal-toolbar">
        <button className={prevEnabled ? 'cal-nav' : 'cal-nav disabled'} onClick={() => prevEnabled && setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1))}>«</button>
        <div className="cal-title">{baseMonth.getMonth() + 1}月 {baseMonth.getFullYear()}</div>
        <button className={nextEnabled ? 'cal-nav' : 'cal-nav disabled'} onClick={() => nextEnabled && setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1))}>»</button>
      </div>
      <div className="cal-panels">
        <Panel date={baseMonth} />
        <Panel date={nextMonth} />
      </div>
      <div className="cal-footer">
        <button className="cal-today" onClick={() => onSelect(fmt(today))}>今天</button>
      </div>
    </div>
  )
}

export default CalendarPopover
