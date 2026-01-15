const mockDbService = {
  get: jest.fn(),
  all: jest.fn(),
  close: jest.fn().mockResolvedValue(),
  init: jest.fn()
};

jest.mock('../../src/services/dbService', () => mockDbService);

const routeService = require('../../src/services/routeService');

describe('RouteService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStationIntervals', () => {
    it('应该正确返回区间列表', async () => {
      mockDbService.all.mockResolvedValue([
        { station: 'A', seq: 1 },
        { station: 'B', seq: 2 },
        { station: 'C', seq: 3 }
      ]);

      const result = await routeService.getStationIntervals('G1', 'A', 'C');
      expect(result).toEqual([
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' }
      ]);
    });

    it('出发站不存在应抛错', async () => {
      mockDbService.all.mockResolvedValue([{ station: 'B', seq: 2 }]);
      await expect(routeService.getStationIntervals('G1', 'A', 'B'))
        .rejects.toEqual(expect.objectContaining({ status: 400 }));
    });
  });

  describe('calculateFare', () => {
    it('应该正确累加票价', async () => {
      const intervals = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }];
      
      mockDbService.get
        .mockResolvedValueOnce({ distance_km: 100, second_class_price: 50 }) // A->B
        .mockResolvedValueOnce({ distance_km: 100, second_class_price: 50 }); // B->C

      const result = await routeService.calculateFare('G1', intervals);
      expect(result.distance_km).toBe(200);
      expect(result.second_class_price).toBe(100);
    });
  });

  describe('calculateAvailableSeats', () => {
    it('应该正确计算余票', async () => {
      const intervals = [{ from: 'A', to: 'B' }];
      // 模拟 dbService.get 返回 count
      mockDbService.get.mockResolvedValue({ count: 5 });

      const result = await routeService.calculateAvailableSeats('G1', '2023-01-01', intervals);
      expect(result['二等座']).toBe(5);
      expect(result['一等座']).toBe(5); 
      // 注意：mock实现简单返回了固定值，实际逻辑已经在service中测试过sql构建
    });
  });
});
