export type Station = {
  code: string; // 简码 e.g. bjb
  name: string; // 中文名 e.g. 北京北
  telecode: string; // 电报码 e.g. VAP
  pinyin: string; // 全拼 e.g. beijingbei
  initials: string; // 拼音首字母 e.g. bjb
  id: string; // ID e.g. 0
  cityName: string; // 城市名 e.g. 北京
}

const API_BASE_URL = '/api'

let cachedStations: Station[] = []

export const loadAllStations = async (): Promise<Station[]> => {
  if (cachedStations.length > 0) return cachedStations
  try {
    const res = await fetch('/station_name.js')
    const txt = await res.text()
    const match = txt.match(/var\s+station_names\s*=\s*'([^']+)'/)
    const raw = match ? match[1] : ''
    const items = raw.split('@').filter(Boolean)
    cachedStations = items.map((s) => {
      const parts = s.split('|')
      // Format: @bjb|北京北|VAP|beijingbei|bjb|0|0357|北京|||
      return {
        code: parts[0],
        name: parts[1],
        telecode: parts[2],
        pinyin: parts[3],
        initials: parts[4],
        id: parts[5],
        cityName: parts[7] || parts[1] // Default to station name if no city
      }
    })
    return cachedStations
  } catch (e) {
    console.error('Failed to load station data', e)
    return []
  }
}

export const getStationCity = async (stationName: string): Promise<string> => {
  const stations = await loadAllStations()
  const s = stations.find(s => s.name === stationName)
  return s ? s.cityName : stationName
}

export const getStationsByCity = async (cityName: string): Promise<string[]> => {
  const stations = await loadAllStations()
  return stations.filter(s => s.cityName === cityName).map(s => s.name)
}
export const getAllStations = async (): Promise<any[]> => {
  const stations = await loadAllStations()
  return stations.map(s => ({ name: s.name }))
}

export const searchStations = async (keyword: string): Promise<Station[]> => {
  const stations = await loadAllStations()
  const key = String(keyword || '').toLowerCase()
  if (!key) return []

  return stations.filter((s) => {
    return (
      s.name.includes(key) ||
      s.pinyin.toLowerCase().startsWith(key) ||
      s.initials.toLowerCase().startsWith(key)
    )
  }).slice(0, 10) // Limit to 10 results
}

export const validateStation = async (stationName: string): Promise<{ valid: boolean; station?: any; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/stations/validate?name=${encodeURIComponent(stationName)}`)
    const data = await res.json()
    return { valid: !!data.valid, station: data.valid ? { name: stationName } : undefined, error: data.valid ? undefined : '无法匹配该站点' }
  } catch { return { valid: false, error: '验证站点失败' } }
}
