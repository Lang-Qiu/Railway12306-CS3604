import React, { useState, useRef, useEffect } from 'react'
import './StationInput.css'
import { searchStations, Station } from '../../services/our12306/stationService'
import StationPicker from '../StationPicker'
import SearchDropdown from './SearchDropdown'

type Props = { 
  value: string; 
  placeholder: string; 
  type: 'departure'|'arrival'; 
  id?: string;
  onChange: (v: string) => void; 
  onSelect: (station: string) => void 
}

const StationInput: React.FC<Props> = ({ value, placeholder, id, onChange, onSelect }) => {
  const [showPicker, setShowPicker] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close picker/suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (v: string) => {
    setLoading(true)
    try {
      const results = await searchStations(v)
      setSuggestions(results)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = () => {
    if (!value) {
      setShowPicker(true)
      setShowSuggestions(false)
    } else {
      setShowSuggestions(true)
      setShowPicker(false)
      if (suggestions.length === 0) {
        handleSearch(value)
      }
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    
    if (!v.trim()) {
      setShowSuggestions(false)
      setShowPicker(true)
      return
    }

    setShowPicker(false)
    setShowSuggestions(true)
    handleSearch(v)
  }

  const pick = (station: string) => {
    onSelect(station)
    setShowPicker(false)
    setShowSuggestions(false)
  }

  return (
    <div className="station-input" ref={containerRef}>
      <input 
        id={id}
        type="text" 
        value={value} 
        placeholder={placeholder} 
        onChange={handleChange} 
        onFocus={handleFocus} 
        className="station-input-field" 
      />
      
      {showPicker && (
        <StationPicker 
          onSelect={pick} 
          onClose={() => setShowPicker(false)}
        />
      )}

      {showSuggestions && (
        <SearchDropdown 
          keyword={value}
          results={suggestions}
          onSelect={pick}
        />
      )}
    </div>
  )
}

export default StationInput