import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect } from 'vitest'
import TrainsPageContainer from '../../src/pages/TrainsPageContainer'

describe('UI-TrainsPage acceptance', () => {
  test('has navigation, search, filters, list and footer sections', () => {
    render(
      <MemoryRouter>
        <TrainsPageContainer />
      </MemoryRouter>
    )
    expect(screen.queryByRole('navigation')).toBeTruthy()
    expect(screen.queryByLabelText('search')).toBeTruthy()
    expect(screen.queryByLabelText('filters')).toBeTruthy()
    expect(screen.queryByLabelText('list')).toBeTruthy()
    expect(document.querySelector('footer')).toBeTruthy()
  })
})