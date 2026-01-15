import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainListTable from '../../src/components/TrainListTable'

describe('UI-TrainListTable extra acceptance', () => {
  test('renders table and header count', () => {
    render(<TrainListTable />)
    const table = document.querySelector('table')
    expect(table).toBeTruthy()
    const headers = table!.querySelectorAll('th')
    expect(headers.length).toBe(9)
    expect(screen.getByText('车次')).toBeTruthy()
  })
})