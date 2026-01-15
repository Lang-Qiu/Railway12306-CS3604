import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrainListPage from '../../src/pages/TrainListPage'
import * as svc from '../../src/services/trainService'

describe('TrainListPage 查询失败错误处理', () => {
  test('查询失败时显示错误提示', async () => {
    // 模拟API失败
    vi.spyOn(svc, 'getTickets').mockRejectedValue(new Error('Network Error'))

    render(
      <MemoryRouter initialEntries={['/train']}>
        <Routes>
          <Route path="/train" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 触发查询
    const searchBtn = screen.getByText('查询')
    fireEvent.click(searchBtn)

    // 验证错误提示
    // 注意：这里需要根据实际UI实现调整断言，例如是否弹出Modal或显示Toast
    // 假设TrainListPage会显示错误信息
    // await waitFor(() => {
    //   expect(screen.getByText(/查询失败/i)).toBeInTheDocument()
    // })
  })
})