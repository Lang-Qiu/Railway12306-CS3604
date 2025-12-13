import client from './client'

export type AddressPayload = {
  provinceCode: string
  cityCode: string
  districtCode: string
  townCode: string
  areaCode?: string
  detailAddress: string
  recipient: string
  phone: string
}

export type AddressItem = {
  id: string
  recipient: string
  phone: string
  addressText: string
  createdAt: string
  lockedUntil?: string
}

export async function listAddresses(): Promise<AddressItem[]> {
  const res = await client.get('/api/user/addresses')
  return res.data?.addresses ?? []
}

export async function createAddress(payload: AddressPayload): Promise<{ message: string; id: string }>{
  const res = await client.post('/api/user/addresses', payload)
  return res.data
}

export async function updateAddress(id: string, payload: AddressPayload): Promise<{ message: string }>{
  const res = await client.put(`/api/user/addresses/${id}`, payload)
  return res.data
}

export async function deleteAddress(id: string): Promise<{ message: string }>{
  const res = await client.delete(`/api/user/addresses/${id}`)
  return res.data
}

