import React, { useEffect, useMemo, useState } from 'react'
import './StationPicker.css'

type Props = {
  style?: React.CSSProperties
  onSelect: (name: string) => void
  onClose: () => void
}

type Station = { name: string; pinyin: string; initial: string }

const DOMESTIC_TABS = ['热门', 'ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXYZ']
const HOT_STATIONS = [
  '北京', '上海', '天津', '重庆', '长沙', '长春', '成都', '福州',
  '广州', '贵阳', '呼和浩特', '哈尔滨', '合肥', '杭州', '海口',
  '济南', '昆明', '拉萨', '兰州', '南宁', '南京', '南昌', '沈阳',
  '石家庄', '太原', '乌鲁木齐', '武汉', '西宁', '西安', '银川',
  '郑州', '深圳', '厦门'
]

const INTERNATIONAL_STATIONS: Record<string, string[]> = {
  '老挝': ['万象', '磨丁', '琅勃拉邦', '孟赛', '纳堆', '万荣'],
  '越南': ['河内', '同登', '下龙湾'] // Added Vietnam for demo purposes
}
const INTERNATIONAL_TABS = Object.keys(INTERNATIONAL_STATIONS)

async function loadStations(): Promise<Station[]> {
  try {
    const res = await fetch('/station_name.js')
    const txt = await res.text()
    const match = txt.match(/var\s+station_names\s*=\s*'([^']+)'/)
    const raw = match ? match[1] : ''
    const items = raw.split('@').filter(Boolean)
    return items.map((s) => {
      const parts = s.split('|')
      // parts[1] is name, parts[3] is pinyin, parts[4] is initial (sometimes short pinyin)
      // Actually parts[2] is code. Let's stick to parts[3] for pinyin.
      // We can derive initial from pinyin or use parts[4] if suitable.
      // Let's just take the first letter of pinyin as initial.
      const pinyin = parts[3]
      const initial = pinyin ? pinyin[0].toUpperCase() : ''
      return { name: parts[1], pinyin, initial }
    })
  } catch {
    return []
  }
}

const StationPicker: React.FC<Props> = ({ style, onSelect, onClose }) => {
  const [stations, setStations] = useState<Station[]>([])
  const [activeTab, setActiveTab] = useState<string>('热门')
  const [activeRegion, setActiveRegion] = useState<'domestic' | 'international'>('domestic')

  useEffect(() => {
    loadStations().then(setStations)
  }, [])

  const groupedStations = useMemo(() => {
    const groups: Record<string, string[]> = {}
    stations.forEach(s => {
      if (!groups[s.initial]) groups[s.initial] = []
      groups[s.initial].push(s.name)
    })
    // Sort and dedup
    Object.keys(groups).forEach(k => {
      groups[k] = Array.from(new Set(groups[k])).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    })
    return groups
  }, [stations])

  // Reset tab when region changes
  useEffect(() => {
    if (activeRegion === 'domestic') {
      setActiveTab('热门')
    } else {
      setActiveTab(INTERNATIONAL_TABS[0] || '')
    }
  }, [activeRegion])

  const renderContent = () => {
    if (activeRegion === 'international') {
      const list = INTERNATIONAL_STATIONS[activeTab] || []
      return (
        <div className="sp-list">
          <div className="sp-row">
            <div className="sp-items">
              {list.map(s => (
                <button key={s} className="sp-item" onClick={() => onSelect(s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === '热门') {
      return (
        <div className="sp-hot-list">
          {HOT_STATIONS.map(s => (
            <button key={s} className="sp-item" onClick={() => onSelect(s)}>{s}</button>
          ))}
        </div>
      )
    }

    // Filter letters for current tab
    const letters = activeTab.split('')
    return (
      <div className="sp-list">
        {letters.map(letter => {
          const list = groupedStations[letter] || []
          if (list.length === 0) return null
          return (
            <div key={letter} className="sp-row">
              <span className="sp-letter">{letter}</span>
              <div className="sp-items">
                {list.map(s => (
                  <button key={s} className="sp-item" onClick={() => onSelect(s)}>{s}</button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const currentTabs = activeRegion === 'domestic' ? DOMESTIC_TABS : INTERNATIONAL_TABS

  return (
    <div className="station-picker" style={style}>
      <div className="sp-sidebar">
        <button
          className={`sp-side-btn ${activeRegion === 'domestic' ? 'active' : ''}`}
          onClick={() => setActiveRegion('domestic')}
        >
          国内站点
        </button>
        <button
          className={`sp-side-btn ${activeRegion === 'international' ? 'active' : ''}`}
          onClick={() => setActiveRegion('international')}
        >
          国际站点
        </button>
      </div>
      <div className="sp-main">
        <div className="sp-header">
          <div className="sp-tabs">
            {currentTabs.map(tab => (
              <button
                key={tab}
                className={`sp-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="sp-close" onClick={onClose}>×</button>
        </div>
        <div className="sp-content">
          <div className="sp-info-tip">拼音支持首字母输入</div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default StationPicker
