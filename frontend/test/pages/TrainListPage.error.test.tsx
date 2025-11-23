import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrainListPage from '../../src/pages/TrainListPage'
import * as svc from '../../src/services/our12306/trainService'

describe('TrainListPage 查询失败错误处理', () => {
  test('服务失败时显示具体错误消息', async () => {
    vi.spyOn(svc, 'searchTrains').mockResolvedValue({ success: false, error: '缺少必要参数：from、to、date', trains: [] } as any)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/trains', state: { departureStation: '北京', arrivalStation: '上海', departureDate: '2025-11-23' } }] as any}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('缺少必要参数：from、to、date')).toBeTruthy())
  })
})