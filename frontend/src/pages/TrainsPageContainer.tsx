import React, { useEffect, useMemo, useState } from 'react'
import '../styles/trains.css'
import { useLocation, useNavigate } from 'react-router-dom'
import TrainSearchBar from '../components/TrainSearchBar'
import TrainFilterBar from '../components/TrainFilterBar'
import TrainListTable from '../components/TrainListTable'
import { searchTrains } from '../api/trains'

const TrainsPageContainer: React.FC = () => {
  const { search } = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const [query, setQuery] = useState<{ from?: string; to?: string; date?: string; highspeed?: '1' | '0' }>({
    from: params.get('from') || '',
    to: params.get('to') || '',
    date: params.get('date') || '',
    highspeed: (params.get('highspeed') as '1' | '0') || undefined,
  })
  const [filters, setFilters] = useState<{ types: string[]; origins: string[]; destinations: string[]; seatTypes: string[] }>(() => ({
    types: ['GC', 'D'],
    origins: [],
    destinations: [],
    seatTypes: [],
  }))
  const [options, setOptions] = useState<{ types: string[]; origins: string[]; destinations: string[]; seatTypes: string[] }>({ types: ['GC', 'D'], origins: [], destinations: [], seatTypes: [] })
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try { return localStorage.getItem('auth_token') } catch { return null }
  })

  useEffect(() => {
    const auto = async () => {
      if (query.from && query.to && query.date) {
        await doSearch()
      }
    }
    auto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doSearch = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await searchTrains({ from: query.from || '', to: query.to || '', date: query.date || '', highspeed: query.highspeed })
      const list = Array.isArray(res.trains) ? res.trains : []
      setResults(list)
      const origins = Array.from(new Set(list.map((t: any) => t.departure).filter(Boolean)))
      const destinations = Array.from(new Set(list.map((t: any) => t.arrival).filter(Boolean)))
      const seatTypes: string[] = []
      if (list.some((t: any) => Number(t.businessPrice) > 0)) seatTypes.push('商务座')
      if (list.some((t: any) => Number(t.firstClassPrice) > 0)) seatTypes.push('一等座')
      if (list.some((t: any) => Number(t.secondClassPrice) > 0)) seatTypes.push('二等座')
      if (list.some((t: any) => Number(t.softSleeperPrice) > 0)) seatTypes.push('软卧')
      if (list.some((t: any) => Number(t.hardSleeperPrice) > 0)) seatTypes.push('硬卧')
      setOptions({ types: ['GC', 'D'], origins, destinations, seatTypes })
      const next = new URLSearchParams()
      next.set('from', query.from || '')
      next.set('to', query.to || '')
      next.set('date', query.date || '')
      if (query.highspeed === '1') next.set('highspeed', '1')
      navigate(`/trains?${next.toString()}`)
      setLastRefreshAt(Date.now())
    } catch (e) {
      setError('查询失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = results.slice()
    if (filters.types.length) {
      list = list.filter((t) => {
        const no = String(t.trainNumber || '')
        const isGC = no.startsWith('G')
        const isD = no.startsWith('D')
        const needGC = filters.types.includes('GC')
        const needD = filters.types.includes('D')
        if (needGC && isGC) return true
        if (needD && isD) return true
        return false
      })
    }
    if (filters.origins.length) list = list.filter((t) => filters.origins.includes(String(t.departure)))
    if (filters.destinations.length) list = list.filter((t) => filters.destinations.includes(String(t.arrival)))
    if (filters.seatTypes.length) list = list.filter((t) => {
      const hasBusiness = Number(t.businessPrice) > 0
      const hasFirst = Number(t.firstClassPrice) > 0
      const hasSecond = Number(t.secondClassPrice) > 0
      const hasSoft = Number(t.softSleeperPrice) > 0
      const hasHard = Number(t.hardSleeperPrice) > 0
      return (
        (filters.seatTypes.includes('商务座') && hasBusiness) ||
        (filters.seatTypes.includes('一等座') && hasFirst) ||
        (filters.seatTypes.includes('二等座') && hasSecond) ||
        (filters.seatTypes.includes('软卧') && hasSoft) ||
        (filters.seatTypes.includes('硬卧') && hasHard)
      )
    })
    return list
  }, [results, filters])

  const dateList = useMemo(() => {
    const base = query.date ? new Date(query.date) : new Date()
    const out: { key: string; label: string }[] = []
    for (let i = -1; i <= 13; i++) {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const key = `${d.getFullYear()}-${mm}-${dd}`
      const label = `${mm}-${dd}`
      out.push({ key, label })
    }
    return out
  }, [query.date])

  const weekdayText = (key: string) => {
    const n = new Date(key).getDay()
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][n]
  }

  return (
    <div>
      <div role="navigation" />
      <section aria-label="search">
        <TrainSearchBar
          value={{ from: query.from, to: query.to, date: query.date }}
          onChange={(v) => setQuery((p) => ({ ...p, ...v }))}
          onSearch={doSearch}
        />
      </section>
      <div className="date-tabs">
        {dateList.map((d) => (
          <button
            key={d.key}
            className={`date-tab${query.date === d.key ? ' active' : ''}`}
            onClick={() => { setQuery((p) => ({ ...p, date: d.key })); doSearch() }}
          >
            {query.date === d.key ? (<><span className="date-strong">{d.label}</span> <span className="weekday">{weekdayText(d.key)}</span></>) : d.label}
          </button>
        ))}
      </div>
      <section aria-label="filters">
        <TrainFilterBar
          options={options}
          value={filters}
          onChange={(v) => setFilters({
            types: v.types || filters.types,
            origins: v.origins || filters.origins,
            destinations: v.destinations || filters.destinations,
            seatTypes: v.seatTypes || filters.seatTypes,
          })}
        />
      </section>
      <section aria-label="list">
        {loading && <div>加载中...</div>}
        {!loading && filtered.length === 0 && <div>暂无符合条件的车次</div>}
        {!loading && filtered.length > 0 && (
          <TrainListTable
            data={filtered}
            onBook={(trainNo) => {
              if (!authToken) {
                const go = window.confirm('请先登录！')
                if (go) navigate('/login')
                return
              }
              if (lastRefreshAt && Date.now() - lastRefreshAt > 5 * 60 * 1000) {
                const r = window.confirm('页面内容已过期，请重新查询！')
                if (r) doSearch()
                return
              }
              const dep = filtered.find((t) => String(t.trainNumber) === String(trainNo))
              const todayStr = new Date().toISOString().slice(0,10)
              const isToday = (query.date || todayStr) === todayStr
              let near = false
              if (isToday && dep && dep.departureTime) {
                const [hh, mm] = String(dep.departureTime).split(':').map((x) => Number(x))
                const now = new Date()
                const depTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0)
                const diff = (depTime.getTime() - now.getTime()) / (1000 * 60 * 60)
                near = diff > 0 && diff < 3
              }
              if (near) {
                const ok = window.confirm('您选择的列车距开车时间很近了，进站约需20分钟，请确保有足够的时间办理安全检查、实名制验证及检票等手续，以免耽误您的旅行。')
                if (!ok) return
              }
              alert('购票页面加载中...')
            }}
          />
        )}
        {error && <div>{error}</div>}
      </section>
      <footer />
    </div>
  )
}

export default TrainsPageContainer