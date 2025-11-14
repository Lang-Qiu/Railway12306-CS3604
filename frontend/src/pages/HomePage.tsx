import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import StationPicker from '../components/StationPicker'
import CalendarPopover from '../components/CalendarPopover'
import '../styles/base.css'
import './HomePage.css'

type Mode = 'single' | 'round' | 'transfer' | 'refund'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('single')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)
  const [student, setStudent] = useState(false)
  const [highspeed, setHighspeed] = useState(false)
  const [err, setErr] = useState('')
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false)
  const [showRefundStartPicker, setShowRefundStartPicker] = useState(false)
  const [showRefundEndPicker, setShowRefundEndPicker] = useState(false)

  const [refundQueryType, setRefundQueryType] = useState<'order' | 'travel'>('order')
  const [refundStart, setRefundStart] = useState('')
  const [refundEnd, setRefundEnd] = useState('')
  const [refundKeyword, setRefundKeyword] = useState('')

  const images = useMemo(() => [
    '/images/home-carousel/首页_轮播底图1.png',
    '/images/home-carousel/首页_轮播底图2.png',
    '/images/home-carousel/首页_轮播底图3.png',
    '/images/home-carousel/首页_轮播底图4.png',
    '/images/home-carousel/首页_轮播底图5.png',
    '/images/home-carousel/首页_轮播底图6.png',
  ], [])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<number | null>(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (hover) return
    timerRef.current = window.setInterval(() => {
      setIdx((p) => (p + 1) % images.length)
    }, 5000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [hover, images.length])

  useEffect(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
    setRefundStart(`${yyyy}-${mm}-${dd}`)
    setRefundEnd(`${yyyy}-${mm}-${dd}`)
  }, [])

  const swapStations = () => {
    setFrom((prevFrom) => {
      const tmp = to
      setTo(prevFrom)
      return tmp
    })
    setFromError(false)
    setToError(false)
  }

  const submit = () => {
    setErr('')
    if (mode === 'refund') {
      if (!refundStart || !refundEnd) {
        setErr('请填写开始与结束日期')
        return
      }
      navigate(`/trains?mode=refund&type=${refundQueryType}&start=${encodeURIComponent(refundStart)}&end=${encodeURIComponent(refundEnd)}&kw=${encodeURIComponent(refundKeyword)}`)
      return
    }
    if (!from || !to || !date) {
      setFromError(!from)
      setToError(!to)
      setErr('请填写出发地、到达地与日期')
      return
    }
    if (mode === 'round' && !returnDate) {
      setErr('请填写返程日期')
      return
    }
    const params = new URLSearchParams()
    params.set('mode', mode)
    params.set('from', from)
    params.set('to', to)
    params.set('date', date)
    if (mode === 'round') params.set('returnDate', returnDate)
    if (student) params.set('student', '1')
    if (highspeed && (mode === 'single' || mode === 'round')) params.set('highspeed', '1')
    navigate(`/trains?${params.toString()}`)
  }

  const isHighspeedVisible = mode === 'single' || mode === 'round'
  const isStudentVisible = mode !== 'refund'

  return (
    <div className="home-page">
      <TopNavigation />
      <MainNavigation />
      <div className="home-main">
        <div className="carousel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <div className="slides" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {images.map((src, i) => (
              <div key={i} className="slide" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
          <div className="indicators">
            {images.map((_, i) => (
              <button key={i} className={i === idx ? 'dot active' : 'dot'} onClick={() => setIdx(i)} aria-label={`第${i + 1}张`} />
            ))}
          </div>
        </div>

        <div className="query-card">
          <div className="tabs">
            <button className={mode === 'single' ? 'tab active' : 'tab'} onClick={() => setMode('single')}>
              <img className="tab-icon-img" src={mode === 'single' ? '/images/home-carousel/单程_logo_选中.png' : '/images/home-carousel/单程_logo_未选中.png'} alt="" aria-hidden /> 单程
            </button>
            <button className={mode === 'round' ? 'tab active' : 'tab'} onClick={() => setMode('round')}>
              <img className="tab-icon-img" src={mode === 'round' ? '/images/home-carousel/往返_logo_选中.png' : '/images/home-carousel/往返_logo_未选中.png'} alt="" aria-hidden /> 往返
            </button>
            <button className={mode === 'transfer' ? 'tab active' : 'tab'} onClick={() => setMode('transfer')}>
              <img className="tab-icon-img" src={mode === 'transfer' ? '/images/home-carousel/中转换乘_logo_选中.png' : '/images/home-carousel/中转换乘_logo_未选中.png'} alt="" aria-hidden /> 中转换乘
            </button>
            <button className={mode === 'refund' ? 'tab active' : 'tab'} onClick={() => setMode('refund')}>
              <img className="tab-icon-img" src={mode === 'refund' ? '/images/home-carousel/退改签_logo_选中.png' : '/images/home-carousel/退改签_logo_未选中.png'} alt="" aria-hidden /> 退改签
            </button>
          </div>

          {mode !== 'refund' && (
            <>
              <div className="location-group">
                <div className="field">
                  <label>出发地</label>
                  <div className="field-row">
                    <input className={fromError ? 'error' : ''} value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value) setFromError(false) }} placeholder="简拼/全拼/汉字" />
                    <span className="suffix icon" aria-hidden onClick={() => setShowFromPicker((v) => !v)} style={{ cursor: 'pointer' }}>📍</span>
                    {fromError && (
                      <div className="error-tag"><span className="error-icon">!</span> 请选择出发地</div>
                    )}
                    {showFromPicker && (
                      <StationPicker
                        style={{ position:'absolute', top:40, left:0 }}
                        onSelect={(name) => { setFrom(name); setShowFromPicker(false); setFromError(false) }}
                        onClose={() => setShowFromPicker(false)}
                      />
                    )}
                  </div>
                </div>
                <div className="field">
                  <label>到达地</label>
                  <div className="field-row">
                    <input className={toError ? 'error' : ''} value={to} onChange={(e) => { setTo(e.target.value); if (e.target.value) setToError(false) }} placeholder="简拼/全拼/汉字" />
                    <span className="suffix icon" aria-hidden onClick={() => setShowToPicker((v) => !v)} style={{ cursor: 'pointer' }}>📍</span>
                    {toError && (
                      <div className="error-tag"><span className="error-icon">!</span> 请选择到达地</div>
                    )}
                    {showToPicker && (
                      <StationPicker
                        style={{ position:'absolute', top:40, left:0 }}
                        onSelect={(name) => { setTo(name); setShowToPicker(false); setToError(false) }}
                        onClose={() => setShowToPicker(false)}
                      />
                    )}
                  </div>
                </div>
                <div className="swap" onClick={swapStations} title="交换">⇄</div>
              </div>
              <div className="field">
                <label>{mode === 'transfer' ? '乘车日期' : '出发日期'}</label>
                <div className="field-row">
                  <input type="text" value={date} readOnly onFocus={() => setShowDatePicker(true)} placeholder="YYYY-MM-DD" />
                  <span className="suffix icon" aria-hidden onClick={() => setShowDatePicker((v) => !v)} style={{ cursor:'pointer' }}>📅</span>
                  {showDatePicker && (
                    <CalendarPopover
                      style={{ position:'absolute', right:0, top:40 }}
                      value={date}
                      onSelect={(d) => { setDate(d); setShowDatePicker(false) }}
                      onClose={() => setShowDatePicker(false)}
                    />
                  )}
                </div>
              </div>
              {mode === 'round' && (
                <div className="field">
                  <label>返程日期</label>
                  <div className="field-row">
                    <input type="text" value={returnDate} readOnly onFocus={() => setShowReturnDatePicker(true)} placeholder="YYYY-MM-DD" />
                    <span className="suffix icon" aria-hidden onClick={() => setShowReturnDatePicker((v) => !v)} style={{ cursor:'pointer' }}>📅</span>
                    {showReturnDatePicker && (
                      <CalendarPopover
                        style={{ position:'absolute', right:0, top:40 }}
                        value={returnDate}
                        onSelect={(d) => { setReturnDate(d); setShowReturnDatePicker(false) }}
                        onClose={() => setShowReturnDatePicker(false)}
                      />
                    )}
                  </div>
                </div>
              )}
              <div className="options">
                {isStudentVisible && (
                  <label className="option left"><input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} />学生</label>
                )}
                {isHighspeedVisible && (
                  <label className="option right"><input type="checkbox" checked={highspeed} onChange={(e) => setHighspeed(e.target.checked)} />高铁/动车</label>
                )}
              </div>
            </>
          )}

          {mode === 'refund' && (
            <>
              <div className="refund-type">
                <label className={refundQueryType === 'order' ? 'radio active' : 'radio'} onClick={() => setRefundQueryType('order')}>
                  <span className="dot" />订票日期
                </label>
                <label className={refundQueryType === 'travel' ? 'radio active' : 'radio'} onClick={() => setRefundQueryType('travel')}>
                  <span className="dot" />乘车日期
                </label>
              </div>
              <div className="field">
                <label>开始日期</label>
                <div className="field-row">
                  <input type="text" value={refundStart} readOnly onFocus={() => setShowRefundStartPicker(true)} placeholder="YYYY-MM-DD" />
                  <span className="suffix icon" aria-hidden onClick={() => setShowRefundStartPicker((v) => !v)} style={{ cursor:'pointer' }}>📅</span>
                  {showRefundStartPicker && (
                    <CalendarPopover
                      style={{ position:'absolute', right:0, top:40 }}
                      value={refundStart}
                      onSelect={(d) => { setRefundStart(d); setShowRefundStartPicker(false) }}
                      onClose={() => setShowRefundStartPicker(false)}
                    />
                  )}
                </div>
              </div>
              <div className="field">
                <label>结束日期</label>
                <div className="field-row">
                  <input type="text" value={refundEnd} readOnly onFocus={() => setShowRefundEndPicker(true)} placeholder="YYYY-MM-DD" />
                  <span className="suffix icon" aria-hidden onClick={() => setShowRefundEndPicker((v) => !v)} style={{ cursor:'pointer' }}>📅</span>
                  {showRefundEndPicker && (
                    <CalendarPopover
                      style={{ position:'absolute', right:0, top:40 }}
                      value={refundEnd}
                      onSelect={(d) => { setRefundEnd(d); setShowRefundEndPicker(false) }}
                      onClose={() => setShowRefundEndPicker(false)}
                    />
                  )}
                </div>
              </div>
              <div className="field">
                <label>关键词</label>
                <div className="field-row">
                  <input value={refundKeyword} onChange={(e) => setRefundKeyword(e.target.value)} placeholder="订单号/车次/乘客姓名" />
                </div>
              </div>
            </>
          )}

          <button className="primary-btn" onClick={submit}>查 询</button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}

export default HomePage
