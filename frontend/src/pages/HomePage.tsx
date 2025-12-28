import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StationPicker from '../components/StationPicker'
import StationInput from '../components/our12306/StationInput'
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
  // const [err, setErr] = useState('')
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
    // setErr('')
    if (mode === 'refund') {
      if (!refundStart || !refundEnd) {
        // setErr('请填写开始与结束日期')
        return
      }
      navigate(`/trains?mode=refund&type=${refundQueryType}&start=${encodeURIComponent(refundStart)}&end=${encodeURIComponent(refundEnd)}&kw=${encodeURIComponent(refundKeyword)}`)
      return
    }
    if (!from || !to || !date) {
      setFromError(!from)
      setToError(!to)
      // setErr('请填写出发地、到达地与日期')
      return
    }
    if (mode === 'round' && !returnDate) {
      // setErr('请填写返程日期')
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

  const openExternal = (url: string) => { window.open(url, '_blank'); }

  const [activeTab, setActiveTab] = useState<'latest' | 'faq' | 'credit'>('latest')
  const latestList = useMemo(() => ([
    { title: '公 告', href: 'http://www.12306.cn/mormhweb/zxdt/202412/t20241211_43192.html', time: '2024-12-11' },
    { title: '关于铁路客运推广使用全面数字化的电子发票的公告', href: 'http://www.12306.cn/mormhweb/zxdt/202410/t20241023_43048.html', time: '2024-11-07' },
    { title: '关于优化铁路车票改签规则的公告', href: 'http://www.12306.cn/mormhweb/zxdt/202401/t20240111_40579.html', time: '2024-01-11' },
    { title: '外国护照身份核验使用说明', href: 'http://www.12306.cn/mormhweb/zxdt/202311/t20231127_40375.html', time: '2023-12-13' },
    { title: '铁路旅客禁止、限制携带和托运物品目录', href: 'http://www.12306.cn/mormhweb/zxdt/202206/t20220617_37625.html', time: '2023-11-30' },
    { title: '候补购票操作说明', href: 'http://www.12306.cn/mormhweb/zxdt/201905/t20190521_22980.html', time: '2024-04-19' },
    { title: '公 告', href: 'http://www.12306.cn/mormhweb/zxdt/201512/t20151201_3949.html', time: '2022-12-22' },
    { title: '关于铁路车站起售时间的公告', href: 'http://www.12306.cn/mormhweb/zxdt/201411/t20141126_2316.html', time: '2025-11-14' },
    { title: '中国铁路成都局集团有限公司关于2025年11月15日至26日加开部分列车的公告', href: 'http://www.12306.cn/mormhweb/zxdt_news/202511/t20251114_45061.html', time: '2025-11-14' },
    { title: '中国铁路成都局集团有限公司关于2025年11月14日至26日加开部分列车的公告', href: 'http://www.12306.cn/mormhweb/zxdt_news/202511/t20251113_45058.html', time: '2025-11-13' },
  ]), [])
  const latestLeft = useMemo(() => latestList.slice(0, Math.ceil(latestList.length / 2)), [latestList])
  const latestRight = useMemo(() => latestList.slice(Math.ceil(latestList.length / 2)), [latestList])
  const faqLeft = useMemo(() => ([
    { title: '实名制车票', href: 'https://www.12306.cn/gonggao/realNameTicket.html' },
    { title: '售票窗口购票', href: 'https://www.12306.cn/gonggao/ticketWindow.html' },
    { title: '互联网购票', href: 'https://www.12306.cn/gonggao/onlineBooking.html' },
    { title: '互联网退票', href: 'https://www.12306.cn/gonggao/onlineRefund.html' },
    { title: '随身携带品', href: 'https://www.12306.cn/gonggao/carryGoods.html' },
  ]), [])
  const faqRight = useMemo(() => ([
    { title: '进出站', href: 'https://www.12306.cn/gonggao/enterExit.html' },
    { title: '丢失购票时使用的有效身份证件', href: 'https://www.12306.cn/gonggao/lostIdCard.html' },
    { title: '使用居民身份证直接检票乘车', href: 'https://www.12306.cn/gonggao/idCardDirectCheck.html' },
    { title: '广深港跨境列车', href: 'https://www.12306.cn/gonggao/hsrCrossBorder.html' },
  ]), [])

  return (
    <div className="home-page">
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
                  <label htmlFor="fromStationText">出发地</label>
                  <div className="field-row">
                    <StationInput
                      id="fromStationText"
                      value={from}
                      placeholder="简拼/全拼/汉字"
                      type="departure"
                      onChange={(v) => { setFrom(v); if (v) setFromError(false) }}
                      onSelect={(name) => { setFrom(name); setFromError(false) }}
                    />
                    {fromError && (
                      <div className="error-tag"><span className="error-icon">!</span> 请选择出发地</div>
                    )}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="toStationText">到达地</label>
                  <div className="field-row">
                    <StationInput
                      id="toStationText"
                      value={to}
                      placeholder="简拼/全拼/汉字"
                      type="arrival"
                      onChange={(v) => { setTo(v); if (v) setToError(false) }}
                      onSelect={(name) => { setTo(name); setToError(false) }}
                    />
                    {toError && (
                      <div className="error-tag"><span className="error-icon">!</span> 请选择到达地</div>
                    )}
                  </div>
                </div>
                <div className="swap" onClick={swapStations} title="交换">⇄</div>
              </div>
              <div className="field">
                <label>{mode === 'transfer' ? '乘车日期' : '出发日期'}</label>
                <div className="field-row">
                  <input type="text" value={date} readOnly onFocus={() => setShowDatePicker(true)} placeholder="YYYY-MM-DD" />
                  <span className="suffix icon" aria-hidden onClick={() => setShowDatePicker((v) => !v)} style={{ cursor: 'pointer' }}>📅</span>
                  {showDatePicker && (
                    <CalendarPopover
                      style={{ position: 'absolute', right: 0, top: 40 }}
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
                    <span className="suffix icon" aria-hidden onClick={() => setShowReturnDatePicker((v) => !v)} style={{ cursor: 'pointer' }}>📅</span>
                    {showReturnDatePicker && (
                      <CalendarPopover
                        style={{ position: 'absolute', right: 0, top: 40 }}
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
                  <span className="suffix icon" aria-hidden onClick={() => setShowRefundStartPicker((v) => !v)} style={{ cursor: 'pointer' }}>📅</span>
                  {showRefundStartPicker && (
                    <CalendarPopover
                      style={{ position: 'absolute', right: 0, top: 40 }}
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
                  <span className="suffix icon" aria-hidden onClick={() => setShowRefundEndPicker((v) => !v)} style={{ cursor: 'pointer' }}>📅</span>
                  {showRefundEndPicker && (
                    <CalendarPopover
                      style={{ position: 'absolute', right: 0, top: 40 }}
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

      <div className="section-service">
        <ul className="service-list">
          <li style={{ display: 'none' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn'); }}>
              <i className="service-icon ico-s1" />
              <div>接送站</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/specialPassenger'); }}>
              <i className="service-icon ico-s2" />
              <div>重点旅客预约</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/lost'); }}>
              <i className="service-icon ico-s6" />
              <div>遗失物品查找</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/car'); }}>
              <i className="service-icon ico-s4" />
              <div>约车服务</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/shipping'); }}>
              <i className="service-icon ico-s5" />
              <div>便民托运</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/stationGuide'); }}>
              <i className="service-icon ico-s3" />
              <div>车站引导</div>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/showcase'); }}>
              <i className="service-icon ico-s7" />
              <div>站车风采</div>
            </a>
          </li>
          <li className="last">
            <a href="#" onClick={(e) => { e.preventDefault(); openExternal('https://www.12306.cn/feedback'); }}>
              <i className="service-icon ico-s9" />
              <div>用户反馈</div>
            </a>
          </li>
        </ul>
      </div>

      <div className="service-lg">
        <div className="service-lg-wrapper">
          <div className="service-lg-grid">
            <a href="https://cx.12306.cn/tlcx/index.html" target="_blank" rel="noreferrer">
              <img src="https://www.12306.cn/index/images/abanner01.jpg" alt="铁路畅行 惠享出行 尊享体验" />
            </a>
            <a href="https://exservice.12306.cn/excater/index.html" target="_blank" rel="noreferrer">
              <img src="https://www.12306.cn/index/images/abanner02.jpg" alt="餐饮·特产" />
            </a>
            <a href="https://kyfw.12306.cn/otn/view/my_insurance.html" target="_blank" rel="noreferrer">
              <img src="https://www.12306.cn/index/images/abanner05.jpg" alt="铁路保险" />
            </a>
            <a href="https://kyfw.12306.cn/otn/view/commutation_index.html" target="_blank" rel="noreferrer">
              <img src="https://www.12306.cn/index/images/abanner06.jpg" alt="计次·定期票" />
            </a>
          </div>
        </div>
      </div>

      <div className="news-tab">
        <div className="tab-hd">
          <ul className="lists">
            <li className={activeTab === 'latest' ? 'active' : ''}><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('latest') }}>最新发布</a></li>
            <li className={activeTab === 'faq' ? 'active' : ''}><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('faq') }}>常见问题</a></li>
            <li className={activeTab === 'credit' ? 'active' : ''}><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('credit') }}>信用信息</a></li>
          </ul>
        </div>
        <div className="tab-bd">
          <div className="news-index">
            {activeTab === 'latest' && (
              <div className="news-index-columns">
                <ul className="news-index-list state col">
                  {latestLeft.map(item => (
                    <li key={item.href}>
                      <a className="news-tit" href={item.href} target="_self" rel="noreferrer" title={item.title}>{item.title}</a>
                      <em className="news-time">{item.time}</em>
                    </li>
                  ))}
                </ul>
                <ul className="news-index-list state col">
                  {latestRight.map(item => (
                    <li key={item.href}>
                      <a className="news-tit" href={item.href} target="_self" rel="noreferrer" title={item.title}>{item.title}</a>
                      <em className="news-time">{item.time}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'faq' && (
              <div className="news-index-columns">
                <ul className="news-index-list question col">
                  {faqLeft.map(item => (
                    <li key={item.title}>
                      <a className="news-tit" href={item.href} target="_blank" rel="noreferrer">{item.title}</a>
                    </li>
                  ))}
                </ul>
                <ul className="news-index-list question col">
                  {faqRight.map(item => (
                    <li key={item.title}>
                      <a className="news-tit" href={item.href} target="_blank" rel="noreferrer">{item.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'credit' && (
              <div className="credit-panel">
                <div className="discredit-list-box">
                  <dl className="discredit-list">
                    <dt>
                      <span className="icon-wrap" aria-hidden>
                        <svg className="icon-svg" viewBox="0 0 1024 1024"><g transform="matrix(1 0 0 -1 0 1024)"><path d="M827.74360039 34.55275752a10.90863721 10.90863721 0 0 0-7.432258 10.42913672v16.90239287a28.94984385 28.94984385 0 0 1-28.94984385 28.94984385H217.27950049c-15.98834531 0-28.94984385-12.96149854-28.94984385-28.94984385v-12.52695058a10.96857422 10.96857422 0 0 0-9.29032295-10.84869932C127.97814746 30.53506787 90.33267412-13.44318427 90.33173809-65.12341318h809.69656553c-0.02622305 45.35400586-29.18397481 85.55993789-72.28470323 99.6761707z m88.94734628 161.53173808L609.93048886 481.80686807l110.28512022 110.22518144c10.21373526-10.18751308 26.64786709-10.18751308 36.80166446-0.05993701 11.21394375 11.19240352 11.21394375 27.64620175 1.07887587 37.82060332L561.50093692 826.3879292c-10.17346553 10.13506787-26.62819981 10.13506787-36.80166534 0-5.97596221-5.89073906-8.72934434-12.51196699-8.72934434-19.4197711 0-6.90780411 2.75338213-13.52996895 7.65046846-18.40083222L248.98647237 513.87346553c-10.23340253 10.19500489-26.6881377 10.19500489-36.86160235 0.05993701-11.09406885-11.19240352-11.09406885-27.64620175-0.95900098-37.82060332l196.59521338-196.65515127c10.17346553-10.13506787 26.62819981-10.13506787 36.80166446 0 11.14651406 11.23267412 11.14651406 27.66680508 1.01893887 37.8206042L555.74693018 427.62330937 841.46930263 120.86285156a53.16461982 53.16461982 0 0 1 76.6002085-1.31862656 53.16461982 53.16461982 0 0 1-1.37856445 76.5402706zM325.88636856 490.91737734c-4.20967705-4.19094668-11.01446367-4.19094668-15.22414161 0l-0.47950049 0.47950049c-4.19094668 4.20967705-4.19094668 11.01446367 0 15.2241416l220.75005147 220.75005235c4.19562949 4.19562949 11.08844912 4.19562949 15.28407949 0l0.35962558-0.4195626c4.19094668-4.20967705 4.19094668-11.01446367 0-15.2241416L325.88636856 490.91737734z" /></g></svg>
                      </span>
                      失信被执行人(自然人)公示
                    </dt>
                    <div className="discredit-demo">
                      <div className="discredit-empty">
                        <img src="https://www.12306.cn/index/images/empty.png" alt="暂无公示数据" />
                        <div className="empty-text">暂无公示数据</div>
                      </div>
                    </div>
                    <dd className="more"><a href="https://www.12306.cn/queryDishonest/init" target="_blank" rel="noreferrer">更多&gt;</a></dd>
                  </dl>
                  <dl className="discredit-list">
                    <dt>
                      <span className="icon-wrap" aria-hidden>
                        <svg className="icon-svg" viewBox="0 0 1024 1024"><g transform="matrix(1 0 0 -1 0 1024)"><path d="M986.609375-11.5078125H116.4921875v19.722656C116.4921875 26.4609375 136.79492213 41.22656275 161.84374975 41.22656275h779.414063c25.04882838 0 45.35156225-14.76562525 45.35156225-33.01171925V-11.5078125z" /></g></svg>
                      </span>
                      失信已执行人(自然人)公布
                    </dt>
                    <div className="discredit-demo">
                      <div className="discredit-empty">
                        <img src="https://www.12306.cn/index/images/empty.png" alt="暂无公示数据" />
                        <div className="empty-text">暂无公示数据</div>
                      </div>
                    </div>
                    <dd className="more"><a href="https://www.12306.cn/queryDishonest/init" target="_blank" rel="noreferrer">更多&gt;</a></dd>
                  </dl>
                </div>
              </div>
            )}
            <div className="news-more"><a href="http://www.12306.cn/mormhweb/zxdt/index_zxdt.html" target="_blank" rel="noreferrer">更多&gt;</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
