const fs = require('fs')
const path = require('path')

let stationMapCache = null

function loadStationMap() {
  if (stationMapCache) return stationMapCache
  try {
    // Try to load from frontend public
    const p = path.resolve(process.cwd(), '../frontend/public/station_name.js')
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8')
      const match = content.match(/var\s+station_names\s*=\s*'([^']+)'/)
      if (match) {
        const raw = match[1]
        const items = raw.split('@').filter(Boolean)
        const map = {} // City -> [Stations]
        const stationToCity = {} // Station -> City
        items.forEach(item => {
          const parts = item.split('|')
          const stationName = parts[1]
          const cityName = parts[7] // City name is at index 7
          if (cityName) {
             if (!map[cityName]) map[cityName] = []
             map[cityName].push(stationName)
             stationToCity[stationName] = cityName
          } else {
             // Fallback if no city name (rare), map to itself
             if (!map[stationName]) map[stationName] = []
             map[stationName].push(stationName)
             stationToCity[stationName] = stationName
          }
        })
        stationMapCache = { map, stationToCity }
        return stationMapCache
      }
    }
  } catch (e) {
    console.error('Error loading station map:', e)
  }
  return { map: {}, stationToCity: {} }
}

function toTrainItem(j) {
  const r = j && (j.route || j.basic || {})
  const fares = j && j.fares ? j.fares : {}
  const trainNo = j.train_no || j.trainNo || j.code || j.number
  if (!trainNo || !r) return null
  const origin = r.origin || r.from || r.start || r.departure
  const destination = r.destination || r.to || r.end || r.arrival
  const departure_time = r.departure_time || r.departureTime
  const arrival_time = r.arrival_time || r.arrivalTime
  const planned_duration_min = r.planned_duration_min || r.durationMin
  return {
    train_no: trainNo,
    train_type: j.train_type || j.type || '',
    route: {
      origin,
      destination,
      departure_time,
      arrival_time,
      planned_duration_min,
    },
    fares,
  }
}

async function search({ from, to, highspeed }) {
  try {
    const dataPath = path.resolve(process.cwd(), 'database', 'custom_train_data.json');
    if (!fs.existsSync(dataPath)) {
        return [];
    }
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const allTrains = JSON.parse(raw);

    const { map, stationToCity } = loadStationMap()
    
    // Resolve from/to stations
    let fromStations = [from]
    if (map[from]) {
        fromStations = map[from]
    } else if (stationToCity[from]) {
        const city = stationToCity[from]
        if (map[city]) fromStations = map[city]
    }

    let toStations = [to]
    if (map[to]) {
        toStations = map[to]
    } else if (stationToCity[to]) {
        const city = stationToCity[to]
        if (map[city]) toStations = map[city]
    }

    const out = [];
    for (const train of allTrains) {
        const item = toTrainItem(train); // Normalize the item
        if (!item) continue;

        const origin = item.route?.origin;
        const dest = item.route?.destination;

        let match = fromStations.includes(origin) && toStations.includes(dest);
        if (match) {
            if (highspeed === '1') {
                if (item.train_type === 'G' || item.train_type === 'D') {
                    out.push(item);
                }
            } else {
                out.push(item);
            }
        }
    }
    return out;
  } catch (e) {
    console.error('Failed to search train data from custom file:', e);
    return [];
  }
}

module.exports = { search }