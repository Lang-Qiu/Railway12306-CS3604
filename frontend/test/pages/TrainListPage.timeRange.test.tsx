import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TrainListPage from '../../src/pages/TrainListPage'
import * as svc from '../../src/services/our12306/trainService'

describe('TrainListPage 发车时间段筛选', () => {
  test('切换时间段后列表数量变化', async () => {
    vi.spyOn(svc, 'searchTrains').mockResolvedValue({
      success: true,
      trains: [
        { trainNo: 'G101', departureStation: '北京', arrivalStation: '上海', departureTime: '05:10', arrivalTime: '11:09', departureDate: '2025-11-20', duration: 359, availableSeats: { '二等座': 30 } },
        { trainNo: 'G201', departureStation: '北京', arrivalStation: '上海', departureTime: '07:30', arrivalTime: '13:10', departureDate: '2025-11-20', duration: 340, availableSeats: { '一等座': 10 } },
        { trainNo: 'D311', departureStation: '北京', arrivalStation: '上海', departureTime: '18:10', arrivalTime: '23:59', departureDate: '2025-11-20', duration: 349, availableSeats: { '一等座': 6 } },
      ]
    } as any)
    render(
      <MemoryRouter>
        <TrainListPage />
      </MemoryRouter>
    )
    const searchBtn = await screen.findByText('查询')
    fireEvent.click(searchBtn)
    await waitFor(() => expect(screen.queryByText(/共\d+个车次/)).toBeTruthy())
    const select = document.querySelector('.time-dropdown') as HTMLSelectElement
    expect(select).toBeTruthy()
    fireEvent.change(select, { target: { value: '06:00--12:00' } })
    // 06:00--12:00 应该保留 G201 (07:30)，过滤掉 05:10 与 18:10
    await waitFor(() => {
      const rows = document.querySelectorAll('.train-list-body .train-item')
      expect(rows.length).toBe(1)
    })
  })
})