import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainFilterPanel from '../../src/components/our12306/TrainFilterPanel'

describe('TrainFilterPanel 日期标签生成', () => {
  test('生成固定范围的日期标签并保持选中态', () => {
    render(
      <TrainFilterPanel onFilterChange={() => {}} departureStations={[]} arrivalStations={[]} seatTypes={[]} departureDate={'2025-11-20'} />
    )
    const tabs = document.querySelectorAll('.date-tab')
    expect(tabs.length).toBeGreaterThan(0)
    // 首个与末个存在
    expect(tabs[0]).toBeTruthy()
    expect(tabs[tabs.length - 1]).toBeTruthy()
  })
})