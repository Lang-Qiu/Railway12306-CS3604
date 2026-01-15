import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PassengersPage from '../../src/pages/PassengersPage'

const mockPassengers = [
  { id: 1, name: '张三', phone: '13800000000', idCardType: '二代居民身份证', idCardNumber: '110101199001010000', discountType: '成人', verificationStatus: '已通过' },
  { id: 2, name: '李四', phone: '13900000000', idCardType: '护照', idCardNumber: 'P1234567', discountType: '学生', verificationStatus: '待核验' }
]

vi.mock('../../src/api/passengers', () => ({
  listPassengers: vi.fn(async () => mockPassengers), // API returns array directly
  searchPassengers: vi.fn(async () => [mockPassengers[0]]),
  addPassenger: vi.fn(async () => ({ id: 3, ...mockPassengers[0] })),
  updatePassenger: vi.fn(async () => ({ success: true })),
  deletePassenger: vi.fn(async () => ({ success: true }))
}))

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('PassengersPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('应渲染基本结构与表格', async () => {
    renderWithRouter(<PassengersPage />)
    await waitFor(() => {
      const headers = screen.getAllByText('乘车人')
      expect(headers.length).toBeGreaterThan(0)
      expect(screen.getByText('+ 新增乘车人')).toBeInTheDocument()
      expect(screen.getByText('刷新')).toBeInTheDocument()
      expect(screen.getByText('姓名')).toBeInTheDocument()
      expect(screen.getByText('手机号')).toBeInTheDocument()
      expect(screen.getByText('证件类型')).toBeInTheDocument()
      expect(screen.getByText('旅客类型')).toBeInTheDocument()
    })
  })

  it('应支持搜索并更新结果', async () => {
    renderWithRouter(<PassengersPage />)
    await waitFor(() => expect(screen.getByText('张三')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('姓名/手机号/证件号'), { target: { value: '张三' } })
    fireEvent.click(screen.getByText('搜索'))
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.queryByText('李四')).not.toBeInTheDocument()
    })
  })

  it('应支持新增、编辑与删除操作的入口', async () => {
    renderWithRouter(<PassengersPage />)
    await waitFor(() => expect(screen.getByText('张三')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ 新增乘车人'))
    await waitFor(() => expect(screen.getByText('确 定')).toBeInTheDocument())
    fireEvent.click(screen.getByText('取 消'))

    fireEvent.click(screen.getAllByText('编辑')[0])
    await waitFor(() => expect(screen.getByText('编辑乘车人')).toBeInTheDocument())
    fireEvent.click(screen.getByText('取 消'))

    fireEvent.click(screen.getAllByText('删除')[0])
    await waitFor(() => expect(screen.getByText('删除确认')).toBeInTheDocument())
    fireEvent.click(screen.getByText('取 消'))
  })
})