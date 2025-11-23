import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ReserveButton from '../../src/components/our12306/ReserveButton'

describe('ReserveButton 策略管线', () => {
  test('未登录时弹出登录提示', () => {
    render(
      <MemoryRouter>
        <ReserveButton trainNo="G101" departureStation="北京" arrivalStation="上海" departureDate="2025-11-20" departureTime="08:00" hasSoldOut={false} isLoggedIn={false} onReserve={vi.fn()} queryTimestamp={new Date().toISOString()} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('预订'))
    expect(screen.getByText('请先登录！')).toBeTruthy()
  })

  test('过期时间不再阻止预订流程', () => {
    const ts = new Date(Date.now() - 6 * 60 * 1000).toISOString()
    const onReserve = vi.fn()
    render(
      <MemoryRouter>
        <ReserveButton trainNo="G101" departureStation="北京" arrivalStation="上海" departureDate="2025-11-20" departureTime="08:00" hasSoldOut={false} isLoggedIn={true} onReserve={onReserve} queryTimestamp={ts} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('预订'))
    expect(onReserve).toHaveBeenCalledWith('G101')
  })

  test('临近发车弹出温馨提示并确认后触发预订', () => {
    const onReserve = vi.fn()
    const now = new Date()
    const depDate = now.toISOString().split('T')[0]
    const depTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toTimeString().slice(0,5)
    render(
      <MemoryRouter>
        <ReserveButton trainNo="G101" departureStation="北京" arrivalStation="上海" departureDate={depDate} departureTime={depTime} hasSoldOut={false} isLoggedIn={true} onReserve={onReserve} queryTimestamp={new Date().toISOString()} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('预订'))
    expect(screen.getByText('温馨提示')).toBeTruthy()
    fireEvent.click(screen.getByText('确认'))
    expect(onReserve).toHaveBeenCalledWith('G101')
  })
})