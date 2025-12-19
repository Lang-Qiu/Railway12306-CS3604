const fs = require('fs')
const path = require('path')
const { TextDecoder } = require('util');

// 缓存加载的车次数据
let CACHED_TRAINS = null;
const decoder = new TextDecoder('gbk');

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
        console.error('[TrainService] Data root not found!');
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

    const out = [];
    for (const item of allTrains) {
        if (!item) continue;

        const origin = item.route?.origin;
        const dest = item.route?.destination;

        // 包含匹配 (input "北京" matches "北京南")
        // 如果数据源是 "北京南"，input 是 "北京"，input.includes(origin) -> false
        // origin.includes(input) -> true.
        // 如果数据源是 "北京"，input 是 "北京南"，origin.includes(input) -> false.
        
        // 12306 通常要求精确，或者 input 是不带 "站" 的城市名。
        // 数据源里的 station_name 通常是不带 "站" 的（例如 "北京南"），但也有可能有。
        // 刚才看 JSON 内容是 "哈尔滨西"，"北京朝阳"。
        
        // 宽松匹配策略：
        const matchFrom = (origin && from && origin.includes(from)) || (origin && from && from.includes(origin));
        const matchTo = (dest && to && dest.includes(to)) || (dest && to && to.includes(dest));

        if (matchFrom && matchTo) {
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
