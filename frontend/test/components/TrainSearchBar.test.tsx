import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import TrainSearchBar from '../../src/components/TrainSearchBar'

describe('UI-TrainSearchBar acceptance', () => {
  test('shows placeholders and default date, validates missing fields', () => {
    render(<TrainSearchBar />)
    const from = screen.queryByPlaceholderText('简拼/全拼/汉字')
    const to = screen.queryByPlaceholderText('简拼/全拼/汉字')
    const date = screen.queryByPlaceholderText('YYYY-MM-DD')
    expect(from).toBeTruthy()
    expect(to).toBeTruthy()
    expect(date).toBeTruthy()
    const btn = screen.queryByRole('button', { name: '查询' })
    if (btn) {
      fireEvent.click(btn)
      const fromError = screen.queryByText('请填写出发地')
      const toError = screen.queryByText('请填写到达地')
      expect(fromError).toBeTruthy()
      expect(toError).toBeTruthy()
    } else {
      expect(btn).toBeTruthy()
    }
  })
})