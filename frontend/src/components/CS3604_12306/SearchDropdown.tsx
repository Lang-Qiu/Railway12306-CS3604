import React from 'react'
import './SearchDropdown.css'
import { Station } from '../../services/CS3604_12306/stationService'

type Props = {
  keyword: string
  results: Station[]
  onSelect: (stationName: string) => void
}

const SearchDropdown: React.FC<Props> = ({ keyword, results, onSelect }) => {
  if (!results || results.length === 0) return null

  return (
    <div className="search-dropdown">
      <div className="search-header">按"{keyword}"检索:</div>
      <div className="search-list">
        {results.map((s, i) => (
          <div key={s.id || i} className="search-item" onClick={() => onSelect(s.name)}>
            <span className="search-name">{s.name}</span>
            <span className="search-pinyin">{s.pinyin}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchDropdown
