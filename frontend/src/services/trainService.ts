import api from '../api/client';

/**
 * 车次服务 - 封装车次相关的API调用
 */

/**
 * 搜索车次
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 * @param trainTypes 车次类型（可选）
 */
export async function searchTrains(
  departureStation: string,
  arrivalStation: string,
  departureDate: string,
  trainTypes?: string[]
) {
  try {
    const data = await api.post('/trains/search', {
      departureStation,
      arrivalStation,
      departureDate,
      trainTypes: trainTypes || [],
    });

    return {
      success: true,
      trains: data.trains || [],
      timestamp: data.timestamp,
    };
  } catch (error: any) {
    console.error('搜索车次失败:', error);
    // 处理api client抛出的错误
    const errorMessage = error.response?.data?.error || error.message || '查询失败，请稍后重试';
    return {
      success: false,
      error: errorMessage,
      trains: [],
    };
  }
}

/**
 * 获取车次详情
 * @param trainNo 车次号
 */
export async function getTrainDetails(trainNo: string) {
  try {
    const data = await api.get(`/trains/${trainNo}`);
    return {
      success: true,
      train: data,
    };
  } catch (error: any) {
    console.error('获取车次详情失败:', error);
    const errorMessage = error.response?.data?.error || error.message || '获取车次详情失败';
    return {
      success: false,
      error: errorMessage,
      train: null,
    };
  }
}

/**
 * 获取筛选选项
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 */
export async function getFilterOptions(
  departureStation: string,
  arrivalStation: string,
  departureDate: string
) {
  try {
    const data = await api.get(
      `/trains/filter-options?departureStation=${encodeURIComponent(
        departureStation
      )}&arrivalStation=${encodeURIComponent(
        arrivalStation
      )}&departureDate=${departureDate}`
    );

    return {
      success: true,
      options: data,
    };
  } catch (error: any) {
    console.error('获取筛选选项失败:', error);
    const errorMessage = error.response?.data?.error || error.message || '获取筛选选项失败';
    return {
      success: false,
      error: errorMessage,
      options: {
        departureStations: [],
        arrivalStations: [],
        seatTypes: [],
      },
    };
  }
}

/**
 * 计算余票数
 * @param trainNo 车次号
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 */
export async function calculateAvailableSeats(
  trainNo: string,
  departureStation: string,
  arrivalStation: string,
  departureDate: string
) {
  try {
    const data = await api.post('/trains/available-seats', {
      trainNo,
      departureStation,
      arrivalStation,
      departureDate,
    });

    return {
      success: true,
      availableSeats: data.availableSeats,
    };
  } catch (error: any) {
    console.error('计算余票失败:', error);
    const errorMessage = error.response?.data?.error || error.message || '计算余票失败';
    return {
      success: false,
      error: errorMessage,
      availableSeats: {},
    };
  }
}

/**
 * 获取可选日期列表
 */
export async function getAvailableDates() {
  try {
    const data = await api.get('/trains/available-dates');

    return {
      success: true,
      availableDates: data.availableDates || [],
      currentDate: data.currentDate,
    };
  } catch (error: any) {
    console.error('获取可选日期失败:', error);
    const errorMessage = error.response?.data?.error || error.message || '获取可选日期失败';
    return {
      success: false,
      error: errorMessage,
      availableDates: [],
      currentDate: new Date().toISOString().split('T')[0],
    };
  }
}

