const fs = require('fs')
const path = require('path')
const { TextDecoder } = require('util');

// 缓存加载的车次数据
let CACHED_TRAINS = null;
const decoder = new TextDecoder('gbk');

let stationMapCache = null

function loadStationMap() {
  if (stationMapCache) return stationMapCache
  try {
    // Try to load from frontend public
    let p = path.resolve(process.cwd(), '../frontend/public/station_name.js')
    if (!fs.existsSync(p)) {
        p = path.resolve(process.cwd(), 'frontend/public/station_name.js')
    }
    
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

function parseDuration(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

function parseTrainFile(contentBuffer) {
    try {
        const jsonStr = decoder.decode(contentBuffer);
        const json = JSON.parse(jsonStr);
        
        // 适配 12306-code-database 的数据结构
        // 结构: { data: { data: [ { station_name, ... }, ... ] } }
        if (!json.data || !json.data.data || !Array.isArray(json.data.data) || json.data.data.length === 0) {
            return null;
        }

        const stops = json.data.data;
        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];

        // 提取车次号
        const trainNo = firstStop.station_train_code;
        if (!trainNo) return null;

        return {
            train_no: trainNo,
            train_type: firstStop.train_class_name || trainNo[0], // 比如 'G'
            route: {
                origin: firstStop.station_name,
                destination: lastStop.station_name,
                departure_time: firstStop.start_time,
                arrival_time: lastStop.arrive_time,
                planned_duration_min: parseDuration(lastStop.running_time) 
            },
            fares: {} // 数据源无票价，controller层会处理为null
        };
    } catch (e) {
        return null;
    }
}

function loadAllTrains() {
    if (CACHED_TRAINS) return CACHED_TRAINS;

    const trains = [];
    const DATA_ROOT = path.resolve(process.cwd(), 'database', '12306-code-database-2023-12-15-main', 'gbk');
    
    console.log(`[TrainService] Loading train data from: ${DATA_ROOT}`);

    if (!fs.existsSync(DATA_ROOT)) {
        // console.error('[TrainService] Data root not found!');
        return [];
    }

    try {
        const dirs = fs.readdirSync(DATA_ROOT);
        let count = 0;
        
        // 为了性能，只加载常见的高铁动车目录 (G, D, C)
        // 如果需要全部，可以移除过滤
        const targetDirs = ['G', 'D', 'C'];
        
        for (const type of dirs) {
            if (!targetDirs.includes(type)) continue;

            const typeDir = path.join(DATA_ROOT, type);
            if (!fs.statSync(typeDir).isDirectory()) continue;
            
            const files = fs.readdirSync(typeDir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                try {
                    // 读取 Buffer，不指定 encoding
                    const content = fs.readFileSync(path.join(typeDir, file));
                    const item = parseTrainFile(content);
                    if (item) {
                        trains.push(item);
                        count++;
                    }
                } catch (err) {
                    // ignore
                }
            }
        }
        console.log(`[TrainService] Successfully loaded ${count} trains.`);
        CACHED_TRAINS = trains;
    } catch (e) {
        console.error('[TrainService] Error loading train data:', e);
    }
    
    return trains;
}

async function search({ from, to, highspeed }) {
  try {
    const allTrains = loadAllTrains();

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
    for (const item of allTrains) {
        if (!item) continue;

        const origin = item.route?.origin;
        const dest = item.route?.destination;

        let match = fromStations.includes(origin) && toStations.includes(dest);
        
        // Fallback to fuzzy match if strict match fails (from origin/main logic)? 
        // No, HEAD's logic is better if map is correct. 
        // But if map is missing data, origin/main's fuzzy match helps.
        // However, HEAD's logic using fromStations array (which defaults to [from]) covers basic exact match.
        // origin/main used 'includes' which is very loose (e.g. "Beijing" matches "Beijing South").
        // stationMap handles "Beijing" -> ["Beijing South", "Beijing West"...].
        // So HEAD's logic is superior.
        
        if (match) {
            if (highspeed === '1') {
                // 简单判断车次类型
                const type = item.train_type ? item.train_type.toUpperCase() : '';
                if (type.includes('G') || type.includes('D') || type.includes('C') || type.includes('高速') || type.includes('动车')) {
                    out.push(item);
                }
            } else {
                out.push(item);
            }
        }
    }
    return out;
  } catch (e) {
    console.error('Failed to search train data:', e);
    return [];
  }
}

module.exports = { search }
