const dbService = require('./dbService');

class RouteService {
  /**
   * 获取车次在出发站和到达站之间的所有区间
   * @param {string} trainNo 车次号
   * @param {string} departureStation 出发站
   * @param {string} arrivalStation 到达站
   * @returns {Promise<Array<{from: string, to: string}>>} 区间列表
   */
  async getStationIntervals(trainNo, departureStation, arrivalStation) {
    // 1. 查询该车次的所有停靠站（按顺序）
    const stops = await dbService.all(
      'SELECT station, seq FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );

    if (!stops || stops.length === 0) {
      throw { status: 404, message: '未找到该车次的停靠站信息' };
    }

    // 2. 找到出发站和到达站的序号
    const depIndex = stops.findIndex(s => s.station === departureStation);
    const arrIndex = stops.findIndex(s => s.station === arrivalStation);

    if (depIndex === -1 || arrIndex === -1) {
      const errorMsg = depIndex === -1 ? `出发站"${departureStation}"不在该车次的停靠站中` : `到达站"${arrivalStation}"不在该车次的停靠站中`;
      throw { status: 400, message: errorMsg };
    }

    if (depIndex >= arrIndex) {
      throw { status: 400, message: '出发站必须在到达站之前' };
    }

    // 3. 提取途经的所有相邻区间
    const intervals = [];
    for (let i = depIndex; i < arrIndex; i++) {
      intervals.push({
        from: stops[i].station,
        to: stops[i + 1].station
      });
    }

    return intervals;
  }

  /**
   * 计算跨区间票价
   * @param {string} trainNo 车次号
   * @param {Array} intervals 区间列表
   * @returns {Promise<Object>} 票价信息
   */
  async calculateFare(trainNo, intervals) {
    let totalDistance = 0;
    const fareTypes = {
      second_class_price: 0,
      first_class_price: 0,
      business_price: 0,
      hard_sleeper_price: 0,
      soft_sleeper_price: 0
    };

    for (const interval of intervals) {
      const fareRow = await dbService.get(
        `SELECT distance_km, second_class_price, first_class_price, business_price,
                hard_sleeper_price, soft_sleeper_price
         FROM train_fares
         WHERE train_no = ? AND from_station = ? AND to_station = ?`,
        [trainNo, interval.from, interval.to]
      );

      if (!fareRow) {
        // 如果某个区间没有票价信息，可能意味着数据缺失，或者该区间不可售
        // 这里我们可以选择抛错，或者忽略（视业务需求而定）
        // 为了健壮性，这里暂时抛错
        throw { 
          status: 404, 
          message: `未找到区间 ${interval.from}->${interval.to} 的票价信息` 
        };
      }

      totalDistance += fareRow.distance_km || 0;
      Object.keys(fareTypes).forEach(key => {
        if (fareRow[key]) {
          fareTypes[key] += fareRow[key];
        }
      });
    }

    return {
      distance_km: totalDistance,
      ...fareTypes
    };
  }

  /**
   * 计算各席别余票数量
   * @param {string} trainNo 车次号
   * @param {string} departureDate 出发日期
   * @param {Array} intervals 区间列表
   * @returns {Promise<Object>} 各席别余票数量 { '二等座': 10, ... }
   */
  async calculateAvailableSeats(trainNo, departureDate, intervals) {
    const seatTypes = ['商务座', '一等座', '二等座', '硬卧', '软卧', '硬座', '无座'];
    const result = {};

    // 构建查询条件：检查所有区间
    const segmentConditions = intervals.map(() => 
      '(from_station = ? AND to_station = ?)'
    ).join(' OR ');
    
    const segmentParams = intervals.flatMap(s => [s.from, s.to]);
    const intervalCount = intervals.length;

    // 并行查询所有席别的余票
    await Promise.all(seatTypes.map(async (seatType) => {
      try {
        // 核心逻辑：找出在所有指定区间状态都为 'available' 的座位数量
        // 1. 筛选出指定车次、日期、席别的所有座位记录
        // 2. 筛选出属于目标区间的记录
        // 3. 筛选出状态为 available 的记录
        // 4. 按座位号分组
        // 5. 统计每个座位号拥有的 available 记录数，如果等于区间数，说明该座位全程可用
        const row = await dbService.get(
          `SELECT COUNT(*) as count
           FROM (
             SELECT seat_no
             FROM seat_status
             WHERE train_no = ?
             AND departure_date = ?
             AND seat_type = ?
             AND (${segmentConditions})
             AND status = 'available'
             GROUP BY seat_no
             HAVING COUNT(*) = ?
           )`,
          [
            trainNo, departureDate, seatType, ...segmentParams,
            intervalCount
          ]
        );
        
        result[seatType] = row ? row.count : 0;
      } catch (err) {
        console.error(`Query error for ${seatType}:`, err);
        result[seatType] = 0;
      }
    }));

    return result;
  }
}

module.exports = new RouteService();
