import client from './client'

export interface Passenger {
  id: number;
  userId: number;
  name: string;
  phone?: string;
  idCardType?: string;
  idCardNumber?: string;
  discountType?: string;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listPassengers(userId: number) {
  const res = await client.get<Passenger[]>('/api/passengers', { params: { userId } })
  return res.data
}

export async function searchPassengers(userId: number, q: string) {
  const res = await client.get<Passenger[]>('/api/passengers/search', { params: { userId, q } })
  return res.data
}

export async function addPassenger(payload: Partial<Passenger>) {
  const res = await client.post<Passenger>('/api/passengers', payload)
  return res.data
}

export async function updatePassenger(id: number, payload: Partial<Passenger>) {
  const res = await client.put<{ success: boolean; passenger?: Passenger }>(`/api/passengers/${id}`, payload)
  return res.data
}

export async function deletePassenger(id: number, userId: number) {
  const res = await client.delete<{ success: boolean }>(`/api/passengers/${id}`, { params: { userId } })
  return res.data
}