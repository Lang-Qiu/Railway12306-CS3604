import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import * as api from '../../src/api/trains'
import TrainsPageContainer from '../../src/pages/TrainsPageContainer'

describe('TrainsPageContainer interaction', () => {
  test('loads results and generates dynamic options from API', async () => {
    vi.spyOn(api, 'searchTrains').mockResolvedValue({
      success: true,
      trains: [
        { id: 'G101', trainNumber: 'G101', departure: '北京', arrival: '上海', departureTime: '06:10', arrivalTime: '12:09', duration: '5小时59分', businessSeat: 25, firstClassSeat: 8, secondClassSeat: 30, businessPrice: 1600, firstClassPrice: 900, secondClassPrice: 560 },
        { id: 'D201', trainNumber: 'D201', departure: '北京', arrival: '上海', departureTime: '07:10', arrivalTime: '14:29', duration: '7小时19分', businessSeat: 0, firstClassSeat: 0, secondClassSeat: 22, businessPrice: 0, firstClassPrice: 0, secondClassPrice: 300 },
      ]
    })
    render(
      <MemoryRouter initialEntries={["/trains?from=北京&to=上海&date=2025-11-16&highspeed=1"]}>
        <TrainsPageContainer />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByText('车次')).toBeTruthy())
    expect(screen.getByLabelText('GC-高铁/城际')).toBeTruthy()
    expect(screen.getByLabelText('D-动车')).toBeTruthy()
    expect(screen.getByLabelText('origin-北京')).toBeTruthy()
    expect(screen.getByLabelText('destination-上海')).toBeTruthy()
    expect(screen.getByLabelText('seat-business')).toBeTruthy()
    expect(screen.getByLabelText('seat-firstClass')).toBeTruthy()
    expect(screen.getByLabelText('seat-secondClass')).toBeTruthy()
  })

  test('shows empty message when API returns no results', async () => {
    vi.spyOn(api, 'searchTrains').mockResolvedValue({ success: true, trains: [] })
    render(
      <MemoryRouter initialEntries={["/trains?from=北京&to=上海&date=2025-11-16"]}>
        <TrainsPageContainer />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByText('暂无符合条件的车次')).toBeTruthy())
  })
})