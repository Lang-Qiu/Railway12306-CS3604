import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainFilterBar from '../../src/components/TrainFilterBar'

describe('UI-TrainFilterBar extra acceptance', () => {
  test('toggle GC and D checkboxes', () => {
    render(<TrainFilterBar />)
    const gc = screen.getByLabelText('GC-高铁/城际') as HTMLInputElement
    const d = screen.getByLabelText('D-动车') as HTMLInputElement
    expect(gc.checked).toBe(false)
    expect(d.checked).toBe(false)
    fireEvent.click(gc)
    fireEvent.click(d)
    expect(gc.checked).toBe(true)
    expect(d.checked).toBe(true)
  })
})