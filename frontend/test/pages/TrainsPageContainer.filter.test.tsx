import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import * as api from '../../src/api/trains'
import TrainsPageContainer from '../../src/pages/TrainsPageContainer'

describe('TrainsPageContainer filters', () => {
  test('type filter toggling reduces rows', async () => {
    vi.spyOn(api, 'searchTrains').mockResolvedValue({
      success: true,
      trains: [
        { id: 'G101', trainNumber: 'G101', departure: '北京', arrival: '上海', departureTime: '06:10', arrivalTime: '12:09', duration: '5小时59分', businessSeat: 25, firstClassSeat: 8, secondClassSeat: 30, businessPrice: 1600, firstClassPrice: 900, secondClassPrice: 560 },
        { id: 'D201', trainNumber: 'D201', departure: '北京', arrival: '上海', departureTime: '07:10', arrivalTime: '14:29', duration: '7小时19分', businessSeat: 0, firstClassSeat: 0, secondClassSeat: 22, businessPrice: 0, firstClassPrice: 0, secondClassPrice: 300 },
        { id: 'G311', trainNumber: 'G311', departure: '天津', arrival: '上海', departureTime: '08:10', arrivalTime: '13:59', duration: '5小时49分', businessSeat: 20, firstClassSeat: 6, secondClassSeat: 10, businessPrice: 1200, firstClassPrice: 700, secondClassPrice: 500 },
      ]
    })
    render(
      <MemoryRouter initialEntries={["/trains?from=北京&to=上海&date=2025-11-16&highspeed=1"]}>
        <TrainsPageContainer />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByText('车次')).toBeTruthy())
    const table = document.querySelector('table')
    expect(table).toBeTruthy()
    const rowsAll = table!.querySelectorAll('tbody tr')
    expect(rowsAll.length).toBe(3)
    const gc = screen.getByLabelText('GC-高铁/城际') as HTMLInputElement
    fireEvent.click(gc)
    const rowsDOnly = table!.querySelectorAll('tbody tr')
    expect(rowsDOnly.length).toBe(1)
  })
})