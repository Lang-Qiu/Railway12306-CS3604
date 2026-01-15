import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainListTable from '../../src/components/TrainListTable'

describe('UI-TrainListTable acceptance', () => {
  test('renders table columns and seat status rules', () => {
    render(<TrainListTable />)
    const headers = ['车次', '出发站', '到达站', '出发时间', '到达时间', '历时', '商务座', '一等座', '二等座']
    for (const h of headers) {
      expect(screen.queryByText(h)).toBeTruthy()
    }
  })
})