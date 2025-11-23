import React, { useState } from 'react'
import './TrainSearchBar.css'
import StationInput from './StationInput'
import DatePicker from './DatePicker'

type Props = { initialDepartureStation: string; initialArrivalStation: string; initialDepartureDate: string; onSearch: (params: any) => void }

const TrainSearchBar: React.FC<Props> = ({ initialDepartureStation, initialArrivalStation, initialDepartureDate, onSearch }) => {
  const [tripType, setTripType] = useState<'single'|'round'>('single')
  const [ticketType, setTicketType] = useState<'normal'|'student'>('normal')
  const [departureStation, setDepartureStation] = useState(initialDepartureStation || '北京')
  const [arrivalStation, setArrivalStation] = useState(initialArrivalStation || '上海')
  const [departureDate, setDepartureDate] = useState(initialDepartureDate || new Date().toISOString().split('T')[0])
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    const newErrors: Record<string,string> = {}
    if (!departureStation?.trim()) { newErrors.departureStation = '请输入出发地'; setErrors(newErrors); return }
    if (!arrivalStation?.trim()) { newErrors.arrivalStation = '请输入到达地'; setErrors(newErrors); return }
    setErrors({}); setIsLoading(true)
    try { onSearch({ departureStation, arrivalStation, departureDate }) } finally { setIsLoading(false) }
  }
  const handleSwapStations = () => { const tmp = departureStation; setDepartureStation(arrivalStation); setArrivalStation(tmp) }

  return (
    <div className="train-search-bar">
      <div className="search-bar-container">
        <div className="trip-type-selector">
          <label className="radio-option"><input type="radio" name="tripType" value="single" checked={tripType==='single'} onChange={()=>setTripType('single')} /><span className="radio-label">单程</span></label>
          <label className="radio-option"><input type="radio" name="tripType" value="round" checked={tripType==='round'} onChange={()=>setTripType('round')} /><span className="radio-label">往返</span></label>
        </div>
        <div className="vertical-divider-blue" />
        <div className="search-field-inline">
          <label className="search-field-label-inline">出发地</label>
          <StationInput value={departureStation} placeholder="北京北" type="departure" onChange={setDepartureStation} onSelect={setDepartureStation} />
          {errors.departureStation && (<div className="field-error">{errors.departureStation}</div>)}
        </div>
        <button className="swap-stations-btn" onClick={handleSwapStations} aria-label="交换出发地和到达地">
          <svg className="swap-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 12 L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M8 7 L3 12 L8 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 7 L21 12 L16 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div className="search-field-inline">
          <label className="search-field-label-inline">目的地</label>
          <StationInput value={arrivalStation} placeholder="上海" type="arrival" onChange={setArrivalStation} onSelect={setArrivalStation} />
          {errors.arrivalStation && (<div className="field-error">{errors.arrivalStation}</div>)}
        </div>
        <div className="search-field-inline">
          <label className="search-field-label-inline">出发日</label>
          <DatePicker value={departureDate} onChange={setDepartureDate} minDate={new Date().toISOString().split('T')[0]} maxDate={(() => { const max = new Date(); max.setDate(max.getDate()+13); return max.toISOString().split('T')[0] })()} />
        </div>
        <div className="search-field-inline">
          <label className="search-field-label-inline return-label">返程日</label>
          <DatePicker value={returnDate} onChange={setReturnDate} minDate={new Date().toISOString().split('T')[0]} maxDate={(() => { const max = new Date(); max.setDate(max.getDate()+13); return max.toISOString().split('T')[0] })()} disabled={true} />
        </div>
        <div className="vertical-divider-blue" />
        <div className="ticket-type-selector">
          <label className="radio-option"><input type="radio" name="ticketType" value="normal" checked={ticketType==='normal'} onChange={()=>setTicketType('normal')} /><span className="radio-label">普通</span></label>
          <label className="radio-option"><input type="radio" name="ticketType" value="student" checked={ticketType==='student'} onChange={()=>setTicketType('student')} /><span className="radio-label">学生</span></label>
        </div>
        <button className="search-submit-btn" onClick={handleSearch} disabled={isLoading}>查询</button>
      </div>
      {errors.general && <div className="search-error-message">{errors.general}</div>}
    </div>
  )
}

export default TrainSearchBar