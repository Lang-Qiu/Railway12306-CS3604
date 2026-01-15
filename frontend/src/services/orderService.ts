import api from '../api/client';

export interface OrderPageDataParams {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureDate: string;
}

export interface PassengerData {
  passengerId: string;
  ticketType: string;
  seatType: string;
}

export interface OrderSubmitData {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureDate: string;
  passengers: PassengerData[];
}

export interface OrderSearchParams {
  startDate?: string;
  endDate?: string;
  keyword?: string;
  searchType?: string;
}

/**
 * 订单服务
 */
export const orderService = {
  /**
   * 获取订单填写页数据
   */
  getOrderPageData: async (params: OrderPageDataParams) => {
    try {
      const queryParams = new URLSearchParams(params as any);
      return await api.get(`/orders/new?${queryParams.toString()}`);
    } catch (error: any) {
      // 保持原始错误抛出，以便页面处理特殊状态码（如401, 403）
      throw error;
    }
  },

  /**
   * 提交订单
   */
  submitOrder: async (data: OrderSubmitData) => {
    try {
      return await api.post('/orders/submit', data);
    } catch (error: any) {
      // 提取错误信息
      const errorMessage = error.response?.data?.error || error.message || '提交订单失败';
      // 重新抛出带有友好消息的错误
      throw new Error(errorMessage);
    }
  },

  /**
   * 获取用户订单列表
   */
  getOrders: async (params?: OrderSearchParams) => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.searchType) queryParams.append('searchType', params.searchType);
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `/user/orders?${queryString}` : '/user/orders';
      
      const data = await api.get(url);
      return {
        success: true,
        orders: data.orders || [],
      };
    } catch (error: any) {
      console.error('获取订单列表失败:', error);
      return {
        success: false,
        error: error.message || '获取订单列表失败',
        orders: [],
      };
    }
  },

  /**
   * 取消订单
   */
  cancelOrder: async (orderId: string) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`);
      return {
        success: true,
        message: response.message || '订单已取消'
      };
    } catch (error: any) {
      console.error('取消订单失败:', error);
      const errorMessage = error.response?.data?.error || error.message || '取消订单失败';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

export default orderService;
