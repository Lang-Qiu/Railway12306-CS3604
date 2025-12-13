export type Address = {
  id: string
  recipient: string
  phone: string
  regionPath: { provinceCode: string; cityCode: string; districtCode: string; townCode: string; areaCode?: string }
  detailAddress: string
  createdAt: string
  lockedUntil?: string
}

