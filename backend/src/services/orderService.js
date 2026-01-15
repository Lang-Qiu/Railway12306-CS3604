const path = require('path');
const crypto = require('crypto');
const dbService = require('./dbService');
const routeService = require('./routeService');
const trainService = require('./trainService');

// 生成UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * 订单服务
 */

/**
 * 获取订单填写页面数据
 */
async function getOrderPageData(params) {
  const { trainNo, departureStation, arrivalStation, departureDate, userId } = params;
  
  // 验证参数
  if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
    throw { status: 400, message: '参数错误' };
  }
  
  // TODO: 获取车次信息、票价、余票、乘客列表、默认席别
  return {
    trainInfo: {},
    fareInfo: {},
    availableSeats: {},
    passengers: [],
    defaultSeatType: '二等座'
  };
}

/**
 * 获取默认席别
 * G/C/D字头车次默认二等座
 */
async function getDefaultSeatType(trainNo) {
  const firstChar = trainNo.charAt(0);
  
  try {
    const train = await dbService.get(
      'SELECT * FROM trains WHERE train_no = ?',
      [trainNo]
    );
    
    if (!train) {
      throw { status: 404, message: '车次不存在' };
    }
    
    // 根据车次类型确定默认席别
    let defaultSeatType = '硬座';
    if (firstChar === 'G' || firstChar === 'C' || firstChar === 'D') {
      defaultSeatType = '二等座';
    }
    
    return {
      seatType: defaultSeatType,
      price: 0  // 价格需要根据具体区间查询
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: '数据库查询失败' };
  }
}

/**
 * 获取有票席别列表
 * 支持跨区间票价计算
 */
async function getAvailableSeatTypes(params) {
  const { trainNo, departureStation, arrivalStation, departureDate } = params;
  
  try {
    // 步骤1: 计算跨区间票价（自动累加途经区间）
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    const fareData = await routeService.calculateFare(trainNo, intervals);
    
    // 步骤2: 使用 trainService 的 calculateAvailableSeats 获取正确的余票数量
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    );
    
    // 步骤3: 构建席别列表（只返回有票的席别）
    const seatTypeMap = {
      '二等座': fareData.second_class_price,
      '一等座': fareData.first_class_price,
      '商务座': fareData.business_price,
      '硬卧': fareData.hard_sleeper_price,
      '软卧': fareData.soft_sleeper_price
    };
    
    const availableSeatTypes = [];
    
    // 遍历所有席别类型
    for (const [seatType, price] of Object.entries(seatTypeMap)) {
      // 只添加有价格且有余票的席别
      if (price !== null && price !== undefined && price > 0) {
        const available = availableSeats[seatType] || 0;
        if (available > 0) {
          availableSeatTypes.push({
            seat_type: seatType,
            available: available,
            price: price
          });
        }
      }
    }
    
    return availableSeatTypes;
  } catch (error) {
    throw error;
  }
}

/**
 * 创建订单
 */
async function createOrder(orderData) {
  const { userId, trainNo, departureStation, arrivalStation, departureDate, passengers } = orderData;
  
  // 验证至少选择一名乘客
  if (!passengers || passengers.length === 0) {
    throw { status: 400, message: '请选择乘车人！' };
  }
  
  const orderId = uuidv4();
  
  return dbService.transaction(async (tx) => {
    try {
      // 查询车次信息
      const train = await tx.get(
        'SELECT * FROM trains WHERE train_no = ? AND departure_date = ?',
        [trainNo, departureDate]
      );
      
      if (!train) {
        throw { status: 404, message: '车次不存在' };
      }
      
      // 获取票价信息（使用跨区间票价计算）
      const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
      const fareData = await routeService.calculateFare(trainNo, intervals);
      
      const fareRow = {
        second_class_price: fareData.second_class_price,
        first_class_price: fareData.first_class_price,
        business_price: fareData.business_price,
        hard_sleeper_price: fareData.hard_sleeper_price,
        soft_sleeper_price: fareData.soft_sleeper_price
      };
      
      // 为每个乘客计算对应席别的价格
      const getPriceForSeatType = (seatType) => {
        if (seatType === '二等座') {
          return fareRow.second_class_price;
        } else if (seatType === '一等座') {
          return fareRow.first_class_price;
        } else if (seatType === '商务座') {
          return fareRow.business_price;
        } else if (seatType === '硬卧') {
          return fareRow.hard_sleeper_price;
        } else if (seatType === '软卧') {
          return fareRow.soft_sleeper_price;
        } else {
          return fareRow.second_class_price; // 默认二等座价格
        }
      };
      
      // 计算总价：累加每个乘客的票价
      let totalPrice = 0;
      for (const p of passengers) {
        const price = getPriceForSeatType(p.seatType);
        if (!price) {
          throw { status: 400, message: `席别"${p.seatType}"暂不支持` };
        }
        totalPrice += price;
      }
      
      // 获取乘客信息
      const passengerIds = passengers.map(p => p.passengerId).join("','");
      const passengerRecords = await tx.all(
        `SELECT * FROM passengers WHERE id IN ('${passengerIds}')`
      );
      
      // 验证所有乘客是否都存在
      if (!passengerRecords || passengerRecords.length !== passengers.length) {
        throw { status: 400, message: '部分乘客信息不存在，请重新选择乘客' };
      }
      
      // 验证每个乘客ID都能找到对应记录
      for (const p of passengers) {
        const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
        if (!passenger) {
          throw { status: 400, message: `乘客${p.passengerId}不存在` };
        }
      }
      
      // 创建订单
      await tx.run(
        `INSERT INTO orders (id, user_id, train_number, departure_station, arrival_station, 
         departure_date, departure_time, arrival_time, total_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
        [orderId, String(userId), trainNo, departureStation, arrivalStation, departureDate,
         train.departure_time, train.arrival_time, totalPrice]
      );
      
      // 创建订单明细
      for (const [index, p] of passengers.entries()) {
        const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
        // 为每个乘客计算对应席别的价格
        const passengerPrice = getPriceForSeatType(p.seatType);
        
        await tx.run(
          `INSERT INTO order_details (order_id, passenger_id, passenger_name, 
           id_card_type, id_card_number, seat_type, ticket_type, price, sequence_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, p.passengerId, passenger.name, passenger.id_card_type, 
           passenger.id_card_number, p.seatType, p.ticketType || '成人票', 
           passengerPrice, index + 1]
        );
      }
      
      return {
        message: '订单提交成功',
        orderId,
        orderDetails: {
          trainInfo: {
            trainNo,
            departureStation,
            arrivalStation,
            departureDate
          },
          passengers,
          totalPrice
        }
      };
    } catch (error) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || '创建订单失败' };
    }
  });
}

/**
 * 获取订单详细信息
 */
async function getOrderDetails(orderId, userId) {
  try {
    // 查询订单基本信息
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (!order) {
      throw { status: 404, message: '订单不存在' };
    }
    
    // 调试日志：检查userId匹配
    console.log('🔍 订单权限检查:', {
      orderId,
      order_user_id: order.user_id,
      order_user_id_type: typeof order.user_id,
      requested_userId: userId,
      requested_userId_type: typeof userId,
      match: order.user_id === userId,
      string_match: String(order.user_id) === String(userId)
    });
    
    // 兼容userId的类型差异（字符串 vs 数字）
    if (String(order.user_id) !== String(userId)) {
      throw { status: 403, message: '无权访问此订单' };
    }
    
    // 查询订单明细
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ?',
      [orderId]
    );
    
    // 获取乘客积分
    const passengerIds = details.map(d => d.passenger_id);
    let passengerPoints = [];
    if (passengerIds.length > 0) {
      passengerPoints = await dbService.all(
        `SELECT id, points FROM passengers WHERE id IN ('${passengerIds.join("','")}')`
      );
    }
    
    const passengers = details.map(d => {
      const points = passengerPoints.find(p => p.id === d.passenger_id);
      return {
        sequence: d.sequence_number,
        seatType: d.seat_type,
        ticketType: d.ticket_type,
        name: d.passenger_name,
        idCardType: d.id_card_type,
        idCardNumber: d.id_card_number,
        carNumber: d.car_number,
        seatNumber: d.seat_number,
        price: d.price,
        points: points ? points.points : 0
      };
    });
    
    // 获取实时余票信息
    const trainService = require('./trainService');
    let availableSeats = {};
    try {
      availableSeats = await trainService.calculateAvailableSeats(
        order.train_number,
        order.departure_station,
        order.arrival_station,
        order.departure_date
      );
    } catch (err) {
      console.error('获取余票信息失败:', err);
    }
    
    return {
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers,
      availableSeats,
      totalPrice: order.total_price
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: '查询订单明细失败' };
  }
}

/**
 * 确认订单
 * 分配座位并更新座位状态为已预定
 */
async function confirmOrder(orderId, userId) {
  return dbService.transaction(async (tx) => {
    // 1. Get Order
    const order = await tx.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) throw { status: 404, message: '订单不存在' };
    if (order.status !== 'pending') throw { status: 400, message: '订单状态错误' };
    
    // 2. Check Cancellation Limit
    const today = new Date().toISOString().split('T')[0];
    const cancelResult = await tx.get(
      `SELECT COUNT(*) as count FROM order_cancellations 
       WHERE user_id = ? AND cancellation_date = ?`,
      [String(userId), today]
    );
    
    if (cancelResult && cancelResult.count >= 3) {
      throw { status: 403, message: '今日取消订单次数已达上限', code: 'CANCELLATION_LIMIT_EXCEEDED' };
    }
    
    // 3. Get Details
    const details = await tx.all('SELECT * FROM order_details WHERE order_id = ?', [orderId]);
    if (!details || details.length === 0) throw { status: 400, message: '订单明细为空' };
    
    // 4. Pre-check Seats
    // Get segments
    const segments = await routeService.getStationIntervals(order.train_number, order.departure_station, order.arrival_station);
    
    const seatTypeRequirements = {};
    for (const detail of details) {
      seatTypeRequirements[detail.seat_type] = (seatTypeRequirements[detail.seat_type] || 0) + 1;
    }
    
    const segmentConditions = segments.map(() => '(from_station = ? AND to_station = ?)').join(' OR ');
    const segmentParams = segments.flatMap(s => [s.from, s.to]);
    
    for (const [seatType, requiredCount] of Object.entries(seatTypeRequirements)) {
      const allSeats = await tx.all(
        `SELECT DISTINCT car_no, seat_no 
         FROM seat_status 
         WHERE train_no = ? AND departure_date = ? AND seat_type = ?`,
        [order.train_number, order.departure_date, seatType]
      );
      
      if (!allSeats || allSeats.length === 0) throw { status: 400, message: `${seatType}座位不存在` };
      
      let availableCount = 0;
      for (const seat of allSeats) {
        const seatStatuses = await tx.all(
          `SELECT status FROM seat_status 
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND (${segmentConditions})`,
          [order.train_number, order.departure_date, seatType, seat.seat_no, ...segmentParams]
        );
        
        if (seatStatuses.length === segments.length && seatStatuses.every(s => s.status === 'available')) {
          availableCount++;
        }
      }
      
      if (availableCount < requiredCount) {
        throw { status: 400, message: `${seatType}余票不足，需要${requiredCount}张，仅剩${availableCount}张` };
      }
    }
    
    // 5. Allocate Seats
    const ticketInfo = [];
    
    for (const detail of details) {
      const allSeats = await tx.all(
        `SELECT DISTINCT car_no, seat_no FROM seat_status 
         WHERE train_no = ? AND departure_date = ? AND seat_type = ?`,
        [order.train_number, order.departure_date, detail.seat_type]
      );
      
      let selectedSeatNo = null;
      let selectedCarNo = null;
      
      for (const seat of allSeats) {
        // Check if this seat is already taken by previous iteration in this transaction?
        // Wait, seat_status is not updated yet. 
        // We need to keep track of allocated seats in this transaction scope if we don't update DB immediately.
        // But here we update DB immediately inside the loop.
        // However, standard SELECT inside transaction might not see changes made by same transaction unless using specific isolation level or just works in SQLite.
        // SQLite: "Reads and writes within the same transaction see the effects of prior writes in that same transaction." -> So it works.
        
        const seatStatuses = await tx.all(
          `SELECT status FROM seat_status 
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND (${segmentConditions})`,
          [order.train_number, order.departure_date, detail.seat_type, seat.seat_no, ...segmentParams]
        );
        
        if (seatStatuses.length === segments.length && seatStatuses.every(s => s.status === 'available')) {
          selectedSeatNo = seat.seat_no;
          selectedCarNo = seat.car_no;
          break;
        }
      }
      
      if (!selectedSeatNo) throw { status: 400, message: `${detail.seat_type}座位已售罄` };
      
      // Update seat status
      for (const segment of segments) {
        await tx.run(
          `UPDATE seat_status 
           SET status = 'booked', booked_by = ?, booked_at = datetime('now')
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND from_station = ? AND to_station = ?`,
          [String(userId), order.train_number, order.departure_date, detail.seat_type, selectedSeatNo, segment.from, segment.to]
        );
      }
      
      // Update details
      await tx.run(
        'UPDATE order_details SET car_number = ?, seat_number = ? WHERE id = ?',
        [selectedCarNo, selectedSeatNo, detail.id]
      );
      
      ticketInfo.push({
        passengerName: detail.passenger_name,
        seatType: detail.seat_type,
        carNo: selectedCarNo,
        seatNo: selectedSeatNo,
        ticketType: detail.ticket_type
      });
    }
    
    // 6. Update Order
    await tx.run(
      "UPDATE orders SET status = 'confirmed_unpaid', payment_expires_at = datetime('now', '+20 minutes'), updated_at = datetime('now') WHERE id = ?",
      [orderId]
    );
    
    const orderInfo = await tx.get('SELECT payment_expires_at FROM orders WHERE id = ?', [orderId]);
    
    return {
      message: '订单已确认，请完成支付',
      orderId,
      status: 'confirmed_unpaid',
      paymentExpiresAt: orderInfo?.payment_expires_at,
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      tickets: ticketInfo
    };
  });
}

/**
 * 更新订单状态
 */
async function updateOrderStatus(orderId, status) {
  try {
    const result = await dbService.run(
      "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, orderId]
    );
    
    if (result.changes === 0) {
      throw { status: 404, message: '订单不存在' };
    }
    
    return { success: true };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: '更新订单状态失败' };
  }
}

/**
 * 锁定座位
 */
async function lockSeats(orderId, passengers, trainNo, departureDate) {
  // TODO: 实现座位锁定逻辑
  return Promise.resolve([]);
}


/**
 * 确认座位分配
 */
async function confirmSeatAllocation(orderId) {
  // TODO: 实现座位分配确认逻辑
  return Promise.resolve({ success: true });
}

/**
 * 计算订单总价
 * 支持跨区间票价计算
 */
async function calculateOrderTotalPrice(passengers, trainNo, departureStation, arrivalStation) {
  try {
    // 使用跨区间票价计算
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    const fareData = await routeService.calculateFare(trainNo, intervals);
    
    let totalPrice = 0;
    
    passengers.forEach(p => {
      let price = 0;
      if (p.seatType === '二等座') {
        price = fareData.second_class_price;
      } else if (p.seatType === '一等座') {
        price = fareData.first_class_price;
      } else if (p.seatType === '商务座') {
        price = fareData.business_price;
      } else if (p.seatType === '硬卧') {
        price = fareData.hard_sleeper_price;
      } else if (p.seatType === '软卧') {
        price = fareData.soft_sleeper_price;
      } else {
        price = fareData.second_class_price; // 默认二等座价格
      }
      
      totalPrice += price;
    });
    
    return totalPrice;
  } catch (error) {
    throw error;
  }
}

/**
 * 获取支付页面数据
 */
async function getPaymentPageData(orderId, userId) {
  try {
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) {
      throw { status: 404, message: '订单不存在' };
    }
    
    if (order.status !== 'confirmed_unpaid') {
      throw { status: 400, message: '订单状态错误，无法支付' };
    }
    
    // 检查订单是否已过期
    if (order.payment_expires_at) {
      const result = await dbService.get(
        "SELECT datetime('now') > ? as is_expired",
        [order.payment_expires_at]
      );
      
      if (result && result.is_expired === 1) {
        throw { status: 400, message: '订单已过期' };
      }
    }
    
    // 查询订单明细
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
      [orderId]
    );
    
    // 格式化订单明细
    const passengers = details.map(d => ({
      sequence: d.sequence_number,
      name: d.passenger_name,
      idCardType: d.id_card_type,
      idCardNumber: d.id_card_number,
      ticketType: d.ticket_type,
      seatType: d.seat_type,
      carNumber: d.car_number,
      seatNumber: d.seat_number,
      price: d.price
    }));
    
    return {
      orderId: order.id,
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers,
      totalPrice: order.total_price,
      paymentExpiresAt: order.payment_expires_at,
      createdAt: order.created_at
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: '数据库查询失败' };
  }
}

/**
 * 确认支付
 */
async function confirmPayment(orderId, userId) {
  try {
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) {
      throw { status: 404, message: '订单不存在' };
    }
    
    if (order.status !== 'confirmed_unpaid') {
      throw { status: 400, message: '订单状态错误，无法支付' };
    }
    
    // 检查订单是否已过期
    if (order.payment_expires_at) {
      const result = await dbService.get(
        "SELECT datetime('now') > ? as is_expired",
        [order.payment_expires_at]
      );
      
      if (result && result.is_expired === 1) {
        throw { status: 400, message: '订单已过期，请重新购票' };
      }
    }
    
    // 更新订单状态为已支付
    await dbService.run(
      "UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?",
      [orderId]
    );
    
    // 查询订单明细获取座位信息
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
      [orderId]
    );
    
    // 生成订单号（EA + 8位数字）
    const orderNumber = 'EA' + orderId.substring(0, 8).toUpperCase().replace(/-/g, '');
    
    return {
      message: '支付成功',
      orderId: order.id,
      orderNumber,
      status: 'paid',
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers: details.map(d => ({
        name: d.passenger_name,
        seatType: d.seat_type,
        carNumber: d.car_number,
        seatNumber: d.seat_number,
        ticketType: d.ticket_type,
        price: d.price
      })),
      totalPrice: order.total_price
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: '支付失败' };
  }
}

/**
 * 取消订单并记录取消次数
 */
async function cancelOrderWithTracking(orderId, userId) {
  // Step 1: Validate order
  const order = await dbService.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [orderId, String(userId)]
  );
  
  if (!order) {
    throw { status: 404, message: '订单不存在' };
  }
  
  if (order.status !== 'confirmed_unpaid') {
    throw { status: 400, message: '只能取消待支付订单' };
  }
  
  // Step 2: Release seat locks
  try {
    await releaseSeatLocks(orderId);
  } catch (error) {
    console.error('释放座位锁定失败:', error);
    throw { status: 500, message: error.message || '释放座位失败' };
  }
  
  // Step 3 & 4: Record cancellation and Delete order (Atomic Transaction)
  try {
    await dbService.transaction(async (tx) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Record cancellation
      await tx.run(
        `INSERT INTO order_cancellations (user_id, order_id, cancellation_date, cancelled_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [String(userId), orderId, today]
      );
      
      // Delete order details
      await tx.run('DELETE FROM order_details WHERE order_id = ?', [orderId]);
      
      // Delete order
      await tx.run('DELETE FROM orders WHERE id = ?', [orderId]);
    });
    
    return { success: true, message: '订单已取消' };
  } catch (error) {
    console.error('取消订单事务失败:', error);
    // Even if recording/deleting fails, we might have already released seats. 
    // Ideally releaseSeatLocks should be in the same transaction if possible, 
    // but here we keep it separate as per original logic flow (sort of).
    // But original logic had them separate.
    throw { status: 500, message: '取消订单失败' };
  }
}

/**
 * 检查用户是否有未支付的订单
 */
async function hasUnpaidOrder(userId) {
  try {
    const order = await dbService.get(
      `SELECT id FROM orders 
       WHERE user_id = ? 
       AND status = 'confirmed_unpaid' 
       AND (payment_expires_at IS NULL OR datetime('now') <= payment_expires_at)`,
      [String(userId)]
    );
    
    return !!order;
  } catch (error) {
    throw { status: 500, message: '查询失败' };
  }
}

/**
 * 获取订单剩余支付时间（秒）
 */
async function getOrderTimeRemaining(orderId) {
  try {
    const result = await dbService.get(
      `SELECT 
        payment_expires_at,
        CASE 
          WHEN payment_expires_at IS NULL THEN 0
          WHEN datetime('now') > payment_expires_at THEN 0
          ELSE CAST((julianday(payment_expires_at) - julianday('now')) * 86400 AS INTEGER)
        END as remaining_seconds
       FROM orders WHERE id = ?`,
      [orderId]
    );
    
    if (!result || !result.payment_expires_at) {
      return 0;
    }
    
    return Math.max(0, result.remaining_seconds || 0);
  } catch (error) {
    throw { status: 500, message: '查询失败' };
  }
}

/**
 * 释放座位锁定
 */
async function releaseSeatLocks(orderId) {
  try {
    const order = await dbService.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return { success: true };
    }
    
    const details = await dbService.all('SELECT * FROM order_details WHERE order_id = ?', [orderId]);
    
    // 获取出发站和到达站之间的所有区间
    const segments = await routeService.getStationIntervals(
      order.train_number, 
      order.departure_station, 
      order.arrival_station
    );
    
    // 释放每个乘客的座位
    // 这里的循环更新可以使用 Promise.all 并发执行，或者在事务中执行
    // 为了安全，建议顺序执行或事务
    for (const detail of details) {
      if (!detail.seat_number) continue;
      
      for (const segment of segments) {
        await dbService.run(
          `UPDATE seat_status 
           SET status = 'available', booked_by = NULL, booked_at = NULL
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ? 
           AND seat_no = ? 
           AND from_station = ? 
           AND to_station = ?`,
          [order.train_number, order.departure_date, detail.seat_type, 
           detail.seat_number, segment.from, segment.to]
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    throw { status: 500, message: error.message || '释放座位失败' };
  }
}

module.exports = {
  getOrderPageData,
  getDefaultSeatType,
  getAvailableSeatTypes,
  createOrder,
  getOrderDetails,
  confirmOrder,
  updateOrderStatus,
  lockSeats,
  releaseSeatLocks,
  confirmSeatAllocation,
  calculateOrderTotalPrice,
  getPaymentPageData,
  confirmPayment,
  cancelOrderWithTracking,
  hasUnpaidOrder,
  getOrderTimeRemaining
};
