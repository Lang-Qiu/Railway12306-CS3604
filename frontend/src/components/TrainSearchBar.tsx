import React, { useEffect, useState } from 'react'
import '../styles/trains.css'

type Props = {
  value?: { from?: string; to?: string; date?: string }
  onChange?: (v: { from?: string; to?: string; date?: string }) => void
  onSearch?: () => void
}

const TrainSearchBar: React.FC<Props> = ({ value, onChange, onSearch }) => {
  const [from, setFrom] = useState(value?.from || '')
  const [to, setTo] = useState(value?.to || '')
  const [date, setDate] = useState(value?.date || '')
  const [fromErr, setFromErr] = useState('')
  const [toErr, setToErr] = useState('')

  useEffect(() => {
    if (!date) {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      setDate(`${yyyy}-${mm}-${dd}`)
    }
  }, [date])

  const submit = () => {
    setFromErr('')
    setToErr('')
    if (!from) setFromErr('请输入出发地')
    if (!to) setToErr('请输入到达地')
    onChange?.({ from, to, date })
    onSearch?.()
  }

  return (
    <div className="search-bar" role="form" aria-label="车票查询">
      <div className="search-side">
        <label className="radio"><input type="radio" name="tripType" defaultChecked aria-label="单程" />单程</label>
        <label className="radio"><input type="radio" name="tripType" aria-label="往返" />往返</label>
      </div>
      <div className="search-divider" aria-hidden />
      <div className="search-field">
        <span className="search-label">出发地</span>
        <input className="search-input" placeholder="简拼/全拼/汉字" value={from} onChange={(e) => { const v = e.target.value; setFrom(v); if (v) setFromErr('') }} />
        {fromErr && <div className="error-text">{fromErr}</div>}
      </div>
      <button type="button" className="swap-btn" aria-label="交换" title="交换" onClick={() => { const tmp = from; setFrom(to); setTo(tmp); setFromErr(''); setToErr('') }} />
      <div className="search-field">
        <span className="search-label">目的地</span>
        <input className="search-input" placeholder="简拼/全拼/汉字" value={to} onChange={(e) => { const v = e.target.value; setTo(v); if (v) setToErr('') }} />
        {toErr && <div className="error-text">{toErr}</div>}
      </div>
      <div className="search-field">
        <span className="search-label">出发日</span>
        <div className="date-field">
          <input className="search-input" placeholder="YYYY-MM-DD" value={date} readOnly />
          <span className="calendar-icon active" aria-hidden />
        </div>
      </div>
      <div className="search-field">
        <span className="search-label">返程日</span>
        <div className="date-field">
          <input className="search-input" placeholder="YYYY-MM-DD" value={date} readOnly />
          <span className="calendar-icon" aria-hidden />
        </div>
      </div>
      <div className="search-divider" aria-hidden />
      <div className="search-side right">
        <label className="radio"><input type="radio" name="userType" defaultChecked aria-label="普通" />普通</label>
        <label className="radio"><input type="radio" name="userType" aria-label="学生" />学生</label>
      </div>
      <div className="search-action">
        <button className="search-button" onClick={submit}>查询</button>
      </div>
    </div>
  )
}

export default TrainSearchBar