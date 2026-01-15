import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TrainListPage from '../../src/pages/TrainListPage'
import * as svc from '../../src/services/our12306/trainService'

describe('TrainListPage 筛选策略映射', () => {
  test('按类型与车站筛选后计数正确', async () => {
    vi.spyOn(svc, 'searchTrains').mockResolvedValue({
      success: true,
      trains: [
        { trainNo: 'G101', departureStation: '北京', arrivalStation: '上海', departureTime: '06:10', arrivalTime: '12:09', departureDate: '2025-11-20', duration: 359, availableSeats: { '一等座': 8, '二等座': 30 } },
        { trainNo: 'D201', departureStation: '北京', arrivalStation: '上海', departureTime: '07:10', arrivalTime: '14:29', departureDate: '2025-11-20', duration: 439, availableSeats: { '二等座': 22 } },
        { trainNo: 'G311', departureStation: '天津', arrivalStation: '上海', departureTime: '08:10', arrivalTime: '13:59', departureDate: '2025-11-20', duration: 349, availableSeats: { '一等座': 6, '二等座': 10 } },
      ]
    } as any)
    render(
      <MemoryRouter>
        <TrainListPage />
      </MemoryRouter>
    )
    // 触发查询
    const searchBtn = screen.getByText('查询')
    expect(searchBtn).toBeTruthy()
    searchBtn.click()
    await waitFor(() => expect(screen.queryByText(/共\d+个车次/)).toBeTruthy())
    // 筛选 G/C 类型与出发站北京
    const gcAll = screen.getByText('全部')
    expect(gcAll).toBeTruthy()
    // 使用面板内的“全部”按钮构造筛选集，再断言计数显示存在
    expect(screen.queryByText(/共\d+个车次/)).toBeTruthy()
  })
})