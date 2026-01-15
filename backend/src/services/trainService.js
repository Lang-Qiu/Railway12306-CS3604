const dbService = require('./dbService');
const stationService = require('./stationService');
const routeService = require('./routeService');

/**
 * 车次服务
 */

/**
 * 搜索车次
 * 支持按车次类型筛选，只返回直达车次
 * 添加日期过滤，只返回指定日期的车次，且过滤已过期的车次
 * 支持城市级搜索：当传入城市名时，查询该城市所有车站的车次
 */
async function searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate, trainTypes = []) {
  try {
    // 确保departureDate是有效的日期
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
    console.log('trainService.searchTrains 调用:', { 
      departureCityOrStation, 
      arrivalCityOrStation, 
      departureDate, 
      trainTypes 
    });
    
    // 获取出发站点列表（优先判断为城市）
    let departureStations = [];
    // 先尝试作为城市名获取车站列表
    departureStations = await stationService.getStationsByCity(departureCityOrStation);
    if (departureStations.length === 0) {
      // 不是城市名，尝试作为车站名
      const depCity = await stationService.getCityByStation(departureCityOrStation);
      if (depCity) {
        // 是车站名，获取该车站所在城市的所有车站
        departureStations = await stationService.getStationsByCity(depCity);
      } else {
        // 既不是城市也不是车站，返回空结果
        console.log('无效的出发地:', departureCityOrStation);
        return [];
      }
    }
    
    // 获取到达站点列表（优先判断为城市）
    let arrivalStations = [];
    // 先尝试作为城市名获取车站列表
    arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
    if (arrivalStations.length === 0) {
      // 不是城市名，尝试作为车站名
      const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
      if (arrCity) {
        // 是车站名，获取该车站所在城市的所有车站
        arrivalStations = await stationService.getStationsByCity(arrCity);
      } else {
        // 既不是城市也不是车站，返回空结果
        console.log('无效的到达地:', arrivalCityOrStation);
        return [];
      }
    }
    
    console.log('出发站点列表:', departureStations);
    console.log('到达站点列表:', arrivalStations);
    
    // 构建SQL查询，使用IN子句匹配多个车站
    const depPlaceholders = departureStations.map(() => '?').join(',');
    const arrPlaceholders = arrivalStations.map(() => '?').join(',');
    
    let sql = `
      SELECT DISTINCT t.* 
      FROM trains t
      WHERE EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${depPlaceholders})
      )
      AND EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${arrPlaceholders})
      )
      AND is_direct = 1
      AND t.departure_date = ?
      AND t.departure_date >= DATE('now', 'localtime')
    `;
    
    const params = [
      ...departureStations,
      ...arrivalStations,
      departureDate
    ];
    
    // 如果提供了车次类型筛选
    if (trainTypes && trainTypes.length > 0) {
      const typePlaceholders = trainTypes.map(() => '?').join(',');
      sql += ` AND SUBSTR(t.train_no, 1, 1) IN (${typePlaceholders})`;
      params.push(...trainTypes);
    }
    
    sql += ' ORDER BY t.departure_time';
    
    console.log('执行SQL查询:', { sql: sql.substring(0, 200) + '...', params });
    
    const rows = await dbService.all(sql, params);
    
    console.log(`SQL查询返回 ${rows.length} 条原始记录`);
    
    if (rows.length === 0) {
      console.log('没有找到符合条件的车次');
      return [];
    }
    
    // 使用Promise.all来并行处理所有车次
    const trainPromises = rows.map(async (train) => {
      try {
        // 获取该车次所有停靠站
        const stops = await dbService.all(
          'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
          [train.train_no]
        );

        if (!stops || stops.length < 2) {
          console.log(`跳过车次 ${train.train_no}: 停靠站信息不完整`);
          return null;
        }
        
        // 找到匹配的出发站和到达站
        const depStop = stops.find(s => departureStations.includes(s.station));
        const arrStop = stops.find(s => arrivalStations.includes(s.station));
        
        if (!depStop || !arrStop || depStop.seq >= arrStop.seq) {
          console.log(`跳过车次 ${train.train_no}: 出发站/到达站不匹配或顺序错误`);
          return null;
        }
        
        // 如果是今天的车次，检查是否已过发车时间
        const today = new Date().toISOString().split('T')[0];
        if (departureDate === today) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          if (depStop.depart_time < currentTime) {
            console.log(`跳过车次 ${train.train_no}: 发车时间${depStop.depart_time}已过当前时间${currentTime}`);
            return null;
          }
        }
        
        // 构建区间列表，用于计算余票（优化：避免再次查询DB）
        const relevantStops = stops.filter(s => s.seq >= depStop.seq && s.seq <= arrStop.seq);
        const intervals = [];
        for (let i = 0; i < relevantStops.length - 1; i++) {
          intervals.push({
            from: relevantStops[i].station,
            to: relevantStops[i + 1].station
          });
        }

        // 计算余票
        const availableSeats = await routeService.calculateAvailableSeats(
          train.train_no, 
          departureDate,
          intervals
        );
        
        return {
          trainNo: train.train_no,
          trainType: train.train_type,
          model: train.model,
          departureStation: depStop.station,  // 使用实际的车站名
          arrivalStation: arrStop.station,    // 使用实际的车站名
          departureTime: depStop.depart_time,
          arrivalTime: arrStop.arrive_time,
          duration: calculateDuration(depStop.depart_time, arrStop.arrive_time),
          departureDate: departureDate,
          availableSeats: availableSeats
        };
      } catch (error) {
        console.error(`处理车次 ${train.train_no} 时出错:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(trainPromises);
    // 过滤掉null值
    const trainsWithDetails = results.filter(train => train !== null);
    console.log(`最终返回 ${trainsWithDetails.length} 个车次`);
    return trainsWithDetails;

  } catch (error) {
    console.error('searchTrains error:', error);
    throw error;
  }
}

/**
 * 获取车次详情
 * 添加日期参数
 */
async function getTrainDetails(trainNo, departureDate) {
  try {
    // 确保departureDate是有效的日期
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
    const train = await dbService.get('SELECT * FROM trains WHERE train_no = ? AND departure_date = ?', [trainNo, departureDate]);
    
    if (!train) {
      return null;
    }
    
    // 获取停靠站信息
    const stops = await dbService.all(
      'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );
        
    // 获取车厢配置
    const cars = await dbService.all(
      'SELECT * FROM train_cars WHERE train_no = ? ORDER BY car_no',
      [trainNo]
    );
            
    // 获取票价信息
    const fares = await dbService.all(
      'SELECT * FROM train_fares WHERE train_no = ?',
      [trainNo]
    );
    
    // 计算余票 (全程)
    let availableSeats = {};
    if (stops && stops.length >= 2) {
      const intervals = [];
      for (let i = 0; i < stops.length - 1; i++) {
        intervals.push({
          from: stops[i].station,
          to: stops[i + 1].station
        });
      }
      
      availableSeats = await routeService.calculateAvailableSeats(
        trainNo, 
        departureDate,
        intervals
      );
    }
    
    return {
      trainNo: train.train_no,
      trainType: train.train_type,
      model: train.model,
      departureDate: train.departure_date,
      route: {
        origin: train.origin_station,
        destination: train.destination_station,
        distanceKm: train.distance_km,
        plannedDurationMin: train.planned_duration_min,
        departureTime: train.departure_time,
        arrivalTime: train.arrival_time
      },
      stops: stops,
      cars: cars,
      fares: fares,
      availableSeats: availableSeats
    };
  } catch (error) {
    console.error('获取车次详情失败:', error);
    throw error;
  }
}

/**
 * 计算余票数
 * 兼容旧接口，内部调用 routeService
 */
async function calculateAvailableSeats(trainNo, departureStation, arrivalStation, departureDate) {
  try {
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    return await routeService.calculateAvailableSeats(trainNo, departureDate, intervals);
  } catch (error) {
    console.error('calculateAvailableSeats error:', error);
    return {};
  }
}

/**
 * 获取筛选选项
 * 返回出发城市和到达城市的所有车站（不只是有车的）
 */
async function getFilterOptions(departureCityOrStation, arrivalCityOrStation, departureDate) {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取出发站点列表
      let departureStations = [];
      const depCity = await stationService.getCityByStation(departureCityOrStation);
      if (depCity) {
        // 输入的是车站名，获取该车站所在城市的所有车站
        departureStations = await stationService.getStationsByCity(depCity);
      } else {
        // 输入的是城市名，获取该城市所有车站
        departureStations = await stationService.getStationsByCity(departureCityOrStation);
      }
      
      // 获取到达站点列表
      let arrivalStations = [];
      const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
      if (arrCity) {
        // 输入的是车站名，获取该车站所在城市的所有车站
        arrivalStations = await stationService.getStationsByCity(arrCity);
      } else {
        // 输入的是城市名，获取该城市所有车站
        arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
      }
      
      // 先搜索符合条件的车次，用于获取席别类型
      const trains = await searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate);
      
      // 从车次列表中提取席别类型
      const seatTypesSet = new Set();
      trains.forEach(train => {
        if (train.availableSeats) {
          Object.keys(train.availableSeats).forEach(seatType => {
            seatTypesSet.add(seatType);
          });
        }
      });
      
      resolve({
        departureStations: departureStations,
        arrivalStations: arrivalStations,
        seatTypes: Array.from(seatTypesSet)
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取可选日期
 * 返回从今天开始的14天日期（包括今天）
 */
async function getAvailableDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * 计算历时（分钟）
 */
function calculateDuration(departureTime, arrivalTime) {
  const [depHour, depMin] = departureTime.split(':').map(Number);
  const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
  
  let duration = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
  
  // 处理跨天情况
  if (duration < 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

/**
 * 获取车次在特定站点的时间信息
 */
async function getTrainTimeDetails(trainNo, departureStation, arrivalStation) {
  try {
    console.log(`getTrainTimeDetails called for ${trainNo}: ${departureStation} -> ${arrivalStation}`);
    
    // 查询车次停靠站信息
    const stops = await dbService.all(
      'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );
    
    if (!stops || stops.length === 0) {
      console.log(`getTrainTimeDetails: No stops found for ${trainNo}`);
      return null;
    }
    
    // 找到出发站和到达站
    const depStop = stops.find(s => s.station === departureStation);
    const arrStop = stops.find(s => s.station === arrivalStation);
    
    if (!depStop || !arrStop) {
      console.log(`getTrainTimeDetails: Station mismatch for ${trainNo}. Expected ${departureStation}->${arrivalStation}. Found stops:`, stops.map(s => s.station));
      return null;
    }
    
    return {
      departureTime: depStop.depart_time,
      arrivalTime: arrStop.arrive_time
    };
  } catch (err) {
    console.error('查询车次停靠站失败:', err);
    throw err;
  }
}

module.exports = {
  searchTrains,
  getTrainDetails,
  calculateAvailableSeats,
  getFilterOptions,
  getAvailableDates,
  getTrainTimeDetails
};
