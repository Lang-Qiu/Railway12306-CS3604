import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './TrainsPage.css'

import TrainSearchBar from '../components/our12306/TrainSearchBar'
import TrainFilterPanel from '../components/our12306/TrainFilterPanel'
import TrainList from '../components/our12306/TrainList'

import { searchTrains } from '../services/our12306/trainService'

const TrainsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchParams, setSearchParams] = useState<any>({
    departureStation: (location.state as any)?.departureStation || '',
    arrivalStation: (location.state as any)?.arrivalStation || '',
    departureDate: (location.state as any)?.departureDate && !isNaN(new Date((location.state as any)?.departureDate).getTime())
      ? (location.state as any)?.departureDate
      : new Date().toISOString().split('T')[0],
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
  const { isAuthenticated } = useAuth()

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
  const handleNavigateToPersonalCenter = () => navigate(isAuthenticated ? '/information' : '/login')
  const handleMy12306Click = () => handleNavigateToPersonalCenter()

  const handleNavigateToOrderPage = (trainNo: string) => {
    const train = trains.find((t) => t.trainNo === trainNo)
    if (!train) {
      setError('找不到车次信息')
      return
    }
    navigate('/orders', {
      state: {
        train: train,
        date: searchParams.departureDate,
      },
    })
  }

  const handleDateChange = (date: string) => {
    const nextParams = { ...searchParams, departureDate: date }
    setSearchParams(nextParams)
    fetchTrains(nextParams)
  }

  const handleFilterChange = (filters: any) => {
    const strategies: Record<string, (xs: any[]) => any[]> = {}
    if (filters.departureTimeRange) {
      // Handle both "00:00--24:00" (double dash) and "00:00-24:00" (single dash)
      let parts = String(filters.departureTimeRange).split('--')
      if (parts.length !== 2) {
        // Try splitting by single dash, but handle the case where split might result in empty middle element
        const dashParts = String(filters.departureTimeRange).split('-')
        if (dashParts.length === 2) {
          parts = dashParts
        } else if (dashParts.length === 3 && dashParts[1] === '') {
          // Handle '00:00--24:00' split by '-' -> ['00:00', '', '24:00']
          parts = [dashParts[0], dashParts[2]]
        }
      }

      if (parts.length === 2) {
        const [start, end] = parts
        const [sh, sm] = start.split(':').map(Number)
        const [eh, em] = end.split(':').map(Number)

        if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
          const sMin = sh * 60 + sm
          const eMin = eh * 60 + em
          strategies.departureTimeRange = (xs) => xs.filter((t) => {
            // Handle both "HH:MM" and full timestamp "YYYY-MM-DD HH:MM:SS"
            let timeStr = String(t.departureTime || '00:00')
            if (timeStr.includes(' ')) {
              timeStr = timeStr.split(' ')[1] // Get time part
            }
            const [h, m] = timeStr.split(':').map(Number)
            if (isNaN(h) || isNaN(m)) return true // Keep if invalid time to avoid empty list

            const val = h * 60 + m
            return val >= sMin && val <= eMin
          })
        }
      }
    }
    if (filters.trainTypes?.length) {
      const tt = new Set<string>(filters.trainTypes)
      strategies.trainTypes = (xs) => xs.filter((t) => {
        // Handle GC-HighSpeed/Intercity
        const trainNo = String(t.trainNo || '')
        if (!trainNo) return false
        const firstChar = trainNo.charAt(0)

        // If 'G' or 'C' is selected, match both G and C trains (High Speed / Intercity)
        if (tt.has('G') || tt.has('C')) {
          if (firstChar === 'G' || firstChar === 'C') return true
        }

        // Handle 'OTHER' - trains not starting with G, C, D, Z, T, K
        if (tt.has('OTHER')) {
          if (!['G', 'C', 'D', 'Z', 'T', 'K'].includes(firstChar)) return true
        }

        // Default exact match for D, Z, T, K
        return tt.has(firstChar)
      })
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
        if (!seats) return false
        for (const k of st) { if (seats[k] !== undefined) return true }
        return false
      })
    }
    let out = [...trains]
    const keys = Object.keys(strategies)
    let i = 0
    while (i < keys.length) {
      out = strategies[keys[i]](out)
      i += 1
    }
    setFilteredTrains(out)
  }

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
          onDateChange={handleDateChange}
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
            isLoggedIn={isAuthenticated}
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

export default TrainsPage
