import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './TrainListPage.css'
 
import TrainSearchBar from '../components/our12306/TrainSearchBar'
import TrainFilterPanel from '../components/our12306/TrainFilterPanel'
import TrainList from '../components/our12306/TrainList'
 
import { searchTrains } from '../services/our12306/trainService'

const TrainListPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchParams, setSearchParams] = useState<any>({
    departureStation: (location.state as any)?.departureStation || '',
    arrivalStation: (location.state as any)?.arrivalStation || '',
    departureDate: (location.state as any)?.departureDate || new Date().toISOString().split('T')[0],
    isHighSpeed: (location.state as any)?.isHighSpeed || false,
  })
  const [trains, setTrains] = useState<any[]>([])
  const [filteredTrains, setFilteredTrains] = useState<any[]>([])
  const [filterOptions, setFilterOptions] = useState<any>({
    departureStations: [],
    arrivalStations: [],
    seatTypes: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [queryTimestamp, setQueryTimestamp] = useState<Date>(new Date())
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken')
      setIsLoggedIn(!!token)
    }
    checkLoginStatus()
    window.addEventListener('storage', checkLoginStatus)
    return () => window.removeEventListener('storage', checkLoginStatus)
  }, [])

  const fetchTrains = async (params: any) => {
    if (!params.departureStation || !params.arrivalStation) return
    setIsLoading(true)
    setError('')
    try {
      const trainTypes = params.isHighSpeed ? ['G', 'C', 'D'] : []
      const result = await searchTrains(
        params.departureStation,
        params.arrivalStation,
        params.departureDate,
        trainTypes
      )
      if (!result.success) throw new Error(result.error || '查询失败')
      const next = result.trains
      setTrains(next)
      setFilteredTrains(next)
      setQueryTimestamp(new Date())
      const opts = deriveFilterOptions(next)
      setFilterOptions(opts)
    } catch (e: any) {
      setError(e.message || '查询失败，请稍后重试')
      setTrains([])
      setFilteredTrains([])
    } finally {
      setIsLoading(false)
    }
  }

  const deriveFilterOptions = (list: any[]) => {
    const depStations = [...new Set(list.map((t: any) => t.departureStation))]
    const arrStations = [...new Set(list.map((t: any) => t.arrivalStation))]
    const seatTypesSet = new Set<string>()
    let i = 0
    while (i < list.length) {
      const train = list[i]
      const seats = train?.availableSeats
      if (seats) { for (const k of Object.keys(seats)) seatTypesSet.add(k) }
      i += 1
    }
    return {
      departureStations: depStations,
      arrivalStations: arrStations,
      seatTypes: Array.from(seatTypesSet),
    }
  }

  useEffect(() => {
    if (searchParams.departureStation && searchParams.arrivalStation) {
      fetchTrains(searchParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  

  const handleNavigateToLogin = () => navigate('/login')
  const handleNavigateToRegister = () => navigate('/register')
  const handleNavigateToPersonalCenter = () => navigate(isLoggedIn ? '/personal-info' : '/login')
  const handleMy12306Click = () => handleNavigateToPersonalCenter()

  const handleNavigateToOrderPage = (trainNo: string) => {
    const train = trains.find((t) => t.trainNo === trainNo)
    if (!train) {
      setError('找不到车次信息')
      return
    }
    navigate('/orders', {
      state: {
        trainNo: train.trainNo,
        departureStation: searchParams.departureStation,
        arrivalStation: searchParams.arrivalStation,
        departureDate: searchParams.departureDate,
      },
    })
  }

  const handleFilterChange = (filters: any) => {
    const strategies: Record<string, (xs: any[]) => any[]> = {}
    if (filters.departureTimeRange) {
      const [start,end] = String(filters.departureTimeRange).split('--')
      const [sh,sm] = start.split(':').map(Number)
      const [eh,em] = end.split(':').map(Number)
      const sMin = sh*60+sm
      const eMin = eh*60+em
      strategies.departureTimeRange = (xs) => xs.filter((t) => {
        const [h,m] = String(t.departureTime||'00:00').split(':').map(Number)
        const val = h*60+m
        return val>=sMin && val<=eMin
      })
    }
    if (filters.trainTypes?.length) {
      const tt = new Set<string>(filters.trainTypes)
      strategies.trainTypes = (xs) => xs.filter((t) => tt.has(String(t.trainNo || '').charAt(0)))
    }
    if (filters.departureStations?.length) {
      const dep = new Set<string>(filters.departureStations)
      strategies.departureStations = (xs) => xs.filter((t) => dep.has(String(t.departureStation)))
    }
    if (filters.arrivalStations?.length) {
      const arr = new Set<string>(filters.arrivalStations)
      strategies.arrivalStations = (xs) => xs.filter((t) => arr.has(String(t.arrivalStation)))
    }
    if (filters.seatTypes?.length) {
      const st = new Set<string>(filters.seatTypes)
      strategies.seatTypes = (xs) => xs.filter((t) => {
        const seats = t.availableSeats || {}
        for (const k of st) { if (seats[k] !== undefined) return true }
        return false
      })
    }
    let out = [...trains]
    const keys = Object.keys(strategies)
    let i = 0
    while (i < keys.length) { out = strategies[keys[i]](out); i += 1 }
    setFilteredTrains(out)
  }

  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : ''

  return (
    <div className="train-list-page">
      <div className="train-list-content">
        <TrainSearchBar
          initialDepartureStation={searchParams.departureStation || ''}
          initialArrivalStation={searchParams.arrivalStation || ''}
          initialDepartureDate={searchParams.departureDate || ''}
          onSearch={(params) => {
            setSearchParams(params)
            fetchTrains(params)
          }}
        />
        <TrainFilterPanel
          onFilterChange={handleFilterChange}
          departureStations={filterOptions.departureStations || []}
          arrivalStations={filterOptions.arrivalStations || []}
          seatTypes={filterOptions.seatTypes || []}
          departureDate={searchParams.departureDate}
        />
        {error && <div className="error-message">{error}</div>}
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : (
          <TrainList
            trains={filteredTrains}
            onReserve={handleNavigateToOrderPage}
            isLoggedIn={isLoggedIn}
            queryTimestamp={queryTimestamp.toISOString()}
            departureCity={searchParams.departureStation}
            arrivalCity={searchParams.arrivalStation}
            departureDate={searchParams.departureDate}
          />
        )}
      </div>
    </div>
  )
}

export default TrainListPage