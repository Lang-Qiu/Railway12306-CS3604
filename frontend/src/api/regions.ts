import client from './client'

export type RegionLevel = 'province' | 'city' | 'district' | 'town' | 'area'

export type RegionOption = { code: string; name: string }

export async function getRegionOptions(level: RegionLevel, parentCode?: string): Promise<RegionOption[]> {
  const res = await client.get('/api/regions', { params: { level, parentCode } })
  return res.data?.options ?? []
}

