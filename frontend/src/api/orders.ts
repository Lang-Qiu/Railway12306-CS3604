import client from './client'

export interface CreateOrderPayload {
  userId: number;
  trainId: number;
  passengers: {
    passengerId: number;
    seatTypeId: number;
  }[];
}

export async function createOrder(payload: CreateOrderPayload) {
  const res = await client.post('/api/orders', payload)
  return res.data
}

export async function listOrders() {
  const res = await client.get('/api/orders')
  return res.data
}

export async function getOrderDetail(orderId: number) {
  const res = await client.get(`/api/orders/${orderId}`)
  return res.data
}
