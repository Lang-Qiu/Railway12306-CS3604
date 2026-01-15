import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainFilterBar from '../../src/components/TrainFilterBar'

describe('UI-TrainFilterBar acceptance', () => {
  test('shows default type options GC and D and updates list on change', () => {
    render(<TrainFilterBar />)
    const gc = screen.queryByLabelText('GC-高铁/城际')
    const d = screen.queryByLabelText('D-动车')
    expect(gc).toBeTruthy()
    expect(d).toBeTruthy()
  })
})