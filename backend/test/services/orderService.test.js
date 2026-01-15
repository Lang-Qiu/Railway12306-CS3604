// Mock dbService
const mockDbService = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn(async (callback) => await callback(mockDbService))
};

jest.mock('../../src/services/dbService', () => mockDbService);

// Mock trainService
jest.mock('../../src/services/trainService', () => ({
  calculateAvailableSeats: jest.fn()
}));

const orderService = require('../../src/services/orderService');
const trainService = require('../../src/services/trainService');

describe('OrderService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDefaultSeatType() - 获取默认席别', () => {
    it('G字头车次应该返回"二等座"作为默认席别', async () => {
      const trainNo = 'G27';
      
      // Mock db.get() 返回车次信息
      mockDbService.get.mockResolvedValue({
        train_no: 'G27',
        train_type: 'G'
      });

      const result = await orderService.getDefaultSeatType(trainNo);

      expect(result).toEqual({
        seatType: '二等座',
        price: 0
      });
    });

    it('C字头车次应该返回"二等座"作为默认席别', async () => {
      const trainNo = 'C2001';
      
      // Mock db.get() 返回车次信息
      mockDbService.get.mockResolvedValue({
        train_no: 'C2001',
        train_type: 'C'
      });

      const result = await orderService.getDefaultSeatType(trainNo);

      expect(result).toEqual({
        seatType: '二等座',
        price: 0
      });
    });

    it('D字头车次应该返回"二等座"作为默认席别', async () => {
      const trainNo = 'D123';
      
      // Mock db.get() 返回车次信息
      mockDbService.get.mockResolvedValue({
        train_no: 'D123',
        train_type: 'D'
      });

      const result = await orderService.getDefaultSeatType(trainNo);

      expect(result.seatType).toBe('二等座');
      expect(result.price).toBe(0);
    });

    it('车次不存在时应该抛出错误', async () => {
      const trainNo = 'INVALID';
      
      // Mock db.get() 返回 null（车次不存在）
      mockDbService.get.mockResolvedValue(null);

      await expect(orderService.getDefaultSeatType(trainNo)).rejects.toEqual(
        expect.objectContaining({ status: 404, message: '车次不存在' })
      );
    });
  });

  describe('getAvailableSeatTypes() - 获取有票席别列表', () => {
    it('应该只返回有余票的席别', async () => {
      const params = {
        trainNo: 'G27',
        departureStation: '北京南站',
        arrivalStation: '上海虹桥',
        departureDate: '2025-09-14'
      };

      // Mock calculateCrossIntervalFare 需要的数据库调用
      // 1. db.all() 查询停靠站
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);

      // 2. db.get() 查询票价（只有一个区间）
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      // Mock trainService.calculateAvailableSeats
      trainService.calculateAvailableSeats.mockResolvedValueOnce({
        '商务座': 10,
        '一等座': 50,
        '二等座': 100
      });

      const result = await orderService.getAvailableSeatTypes(params);

      expect(result).toHaveLength(3);
      expect(result.every(seat => seat.available > 0)).toBe(true);
      expect(result.find(s => s.seat_type === '商务座').price).toBe(1748);
      expect(result.find(s => s.seat_type === '一等座').price).toBe(933);
      expect(result.find(s => s.seat_type === '二等座').price).toBe(553);
    });

    it('已售罄的席别不应该包含在列表中', async () => {
      const params = {
        trainNo: 'G27',
        departureStation: '北京南站',
        arrivalStation: '上海虹桥',
        departureDate: '2025-09-14'
      };

      // Mock calculateCrossIntervalFare 需要的数据库调用
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);

      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      // Mock trainService.calculateAvailableSeats
      trainService.calculateAvailableSeats.mockResolvedValueOnce({
        '商务座': 0,
        '一等座': 0,
        '二等座': 10
      });

      const result = await orderService.getAvailableSeatTypes(params);

      expect(result).toHaveLength(1);
      expect(result[0].seat_type).toBe('二等座');
      expect(result[0].available).toBeGreaterThan(0);
    });

    it('所有席别售罄时应该返回空数组', async () => {
      const params = {
        trainNo: 'G27',
        departureStation: '北京南站',
        arrivalStation: '上海虹桥',
        departureDate: '2025-09-14'
      };

      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);

      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      trainService.calculateAvailableSeats.mockResolvedValueOnce({
        '商务座': 0,
        '一等座': 0,
        '二等座': 0
      });

      const result = await orderService.getAvailableSeatTypes(params);

      expect(result).toEqual([]);
    });
  });

  describe('createOrder() - 创建订单', () => {
    const validOrderData = {
      userId: 'user-123',
      trainNo: 'G27',
      departureStation: '北京南站',
      arrivalStation: '上海虹桥',
      departureDate: '2025-09-14',
      passengers: [
        {
          passengerId: 'passenger-1',
          ticketType: '成人票',
          seatType: '二等座'
        }
      ]
    };

    it('应该成功创建订单并返回订单详情', async () => {
      // 1. Mock db.get() 查询车次信息
      mockDbService.get.mockResolvedValueOnce({
        train_no: 'G27',
        departure_station: '北京南站',
        arrival_station: '上海虹桥',
        departure_time: '19:00',
        arrival_time: '23:35',
        departure_date: '2025-09-14'
      });

      // 2. Mock calculateCrossIntervalFare 需要的数据库调用
      // 2.1 db.all() 查询停靠站
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);

      // 2.2 db.get() 查询票价
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      // 3. Mock db.all() 查询乘客信息
      mockDbService.all.mockResolvedValueOnce([{
        id: 'passenger-1',
        name: '刘蕊蕊',
        id_card_type: '居民身份证',
        id_card_number: '330102199001011234'
      }]);

      // 4. Mock db.run() 插入订单
      mockDbService.run.mockResolvedValueOnce({ lastID: 1, changes: 1 });

      // 5. Mock db.run() 插入订单明细
      mockDbService.run.mockResolvedValueOnce({ lastID: 1, changes: 1 });

      const result = await orderService.createOrder(validOrderData);

      expect(result.orderId).toBeDefined();
      expect(result.message).toBe('订单提交成功');
      expect(result.orderDetails).toBeDefined();
      expect(result.orderDetails.passengers).toHaveLength(1);
    });

    it('未选择乘车人时应该抛出错误', async () => {
      const invalidData = {
        ...validOrderData,
        passengers: []
      };

      await expect(orderService.createOrder(invalidData)).rejects.toEqual(
        expect.objectContaining({ status: 400, message: '请选择乘车人！' })
      );
    });
  });

  describe('getOrderDetails() - 获取订单详细信息', () => {
    it('应该返回完整的订单详情', async () => {
      const orderId = 'order-123';
      const userId = 'user-123';

      // 1. Mock db.get() 查询订单
      mockDbService.get.mockResolvedValueOnce({
        id: 'order-123',
        user_id: 'user-123',
        train_number: 'G1476',
        departure_station: '上海虹桥站',
        arrival_station: '南京南站',
        departure_date: '2025-11-20',
        departure_time: '09:51',
        arrival_time: '11:29',
        total_price: 553,
        status: 'pending'
      });

      // 2. Mock db.all() 查询订单明细
      mockDbService.all.mockResolvedValueOnce([{
        id: 'detail-1',
        passenger_id: 'passenger-1',
        passenger_name: '刘蕊蕊',
        id_card_type: '居民身份证',
        id_card_number: '330102199001011234',
        seat_type: '二等座',
        ticket_type: '成人票',
        price: 553,
        sequence_number: 1
      }]);

      // 3. Mock db.all() 查询乘客积分
      mockDbService.all.mockResolvedValueOnce([{ id: 'passenger-1', points: 1200 }]);

      // 4. Mock trainService.calculateAvailableSeats
      trainService.calculateAvailableSeats.mockResolvedValueOnce({
        '二等座': 99
      });

      const result = await orderService.getOrderDetails(orderId, userId);

      expect(result.trainInfo).toBeDefined();
      expect(result.trainInfo.trainNo).toBe('G1476');
      expect(result.passengers).toHaveLength(1);
      expect(result.passengers[0].points).toBe(1200);
      expect(result.availableSeats).toHaveProperty('二等座');
      expect(result.totalPrice).toBe(553);
    });

    it('订单不存在时应该抛出错误', async () => {
      const orderId = 'invalid-order';
      const userId = 'user-123';

      mockDbService.get.mockResolvedValueOnce(null);

      await expect(orderService.getOrderDetails(orderId, userId)).rejects.toEqual(
        expect.objectContaining({ status: 404, message: '订单不存在' })
      );
    });

    it('订单不属于当前用户时应该抛出错误', async () => {
      const orderId = 'order-123';
      const userId = 'user-456';

      mockDbService.get.mockResolvedValueOnce({
        id: 'order-123',
        user_id: 'user-123'
      });

      await expect(orderService.getOrderDetails(orderId, userId)).rejects.toEqual(
        expect.objectContaining({ status: 403, message: '无权访问此订单' })
      );
    });
  });

  describe('updateOrderStatus() - 更新订单状态', () => {
    it('应该成功更新订单状态', async () => {
      const orderId = 'order-123';
      const status = 'processing';

      mockDbService.run.mockResolvedValueOnce({ lastID: 0, changes: 1 });

      const result = await orderService.updateOrderStatus(orderId, status);

      expect(result.success).toBe(true);
      expect(mockDbService.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([status, orderId])
      );
    });

    it('订单不存在时应该抛出错误', async () => {
      const orderId = 'invalid-order';
      const status = 'processing';

      mockDbService.run.mockResolvedValueOnce({ lastID: 0, changes: 0 });

      await expect(orderService.updateOrderStatus(orderId, status)).rejects.toEqual(
        expect.objectContaining({ status: 404, message: '订单不存在' })
      );
    });
  });

  describe('releaseSeatLocks() - 释放座位锁定', () => {
    it('应该释放指定订单的所有座位锁定', async () => {
      const orderId = 'order-123';

      // 1. Mock db.get() 查询订单
      mockDbService.get.mockResolvedValueOnce({
        id: 'order-123',
        train_number: 'G27',
        departure_station: '北京南站',
        arrival_station: '上海虹桥',
        departure_date: '2025-09-14'
      });

      // 2. Mock db.all() 查询订单明细
      mockDbService.all.mockResolvedValueOnce([{
        id: 'detail-1',
        seat_type: '二等座',
        seat_number: '01A'
      }]);

      // 3. Mock db.all() 查询停靠站
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站' },
        { station: '上海虹桥' }
      ]);

      // 4. Mock db.run() 更新座位状态
      mockDbService.run.mockResolvedValue({ lastID: 0, changes: 1 });

      const result = await orderService.releaseSeatLocks(orderId);

      expect(result.success).toBe(true);
      expect(mockDbService.run).toHaveBeenCalled();
    });

    it('订单没有锁定的座位时不应该抛出错误', async () => {
      const orderId = 'order-123';

      mockDbService.get.mockResolvedValueOnce(null);

      const result = await orderService.releaseSeatLocks(orderId);

      expect(result.success).toBe(true);
    });
  });

  describe('calculateOrderTotalPrice() - 计算订单总价', () => {
    it('应该正确计算多个乘客的订单总价', async () => {
      const passengers = [
        { passengerId: 'p1', seatType: '二等座' },
        { passengerId: 'p2', seatType: '二等座' },
        { passengerId: 'p3', seatType: '一等座' }
      ];

      // P1
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      // P2
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      // P3
      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      const totalPrice = await orderService.calculateOrderTotalPrice(passengers, 'G27', '北京南站', '上海虹桥');

      expect(totalPrice).toBe(553 + 553 + 933);
    });

    it('单个乘客的订单应该返回单张票价', async () => {
      const passengers = [
        { passengerId: 'p1', seatType: '二等座' }
      ];

      mockDbService.all.mockResolvedValueOnce([
        { station: '北京南站', seq: 1 },
        { station: '上海虹桥', seq: 2 }
      ]);
      mockDbService.get.mockResolvedValueOnce({
        distance_km: 1318,
        second_class_price: 553,
        first_class_price: 933,
        business_price: 1748,
        hard_sleeper_price: 0,
        soft_sleeper_price: 0
      });

      const totalPrice = await orderService.calculateOrderTotalPrice(passengers, 'G27', '北京南站', '上海虹桥');

      expect(totalPrice).toBe(553);
    });
  });
});

