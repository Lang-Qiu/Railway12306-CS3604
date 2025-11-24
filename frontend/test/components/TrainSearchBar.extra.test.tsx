import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import TrainSearchBar from '../../src/components/TrainSearchBar'

describe('UI-TrainSearchBar extra acceptance', () => {
  test('calls onSearch and propagates changes', () => {
    const onSearch = vi.fn()
    const onChange = vi.fn()
    render(<TrainSearchBar onSearch={onSearch} onChange={onChange} />)
    const from = screen.getByPlaceholderText('简拼/全拼/汉字')
    const to = screen.getByPlaceholderText('到达站')
    fireEvent.change(from, { target: { value: '北京' } })
    fireEvent.change(to, { target: { value: '上海' } })
    const btn = screen.getByRole('button', { name: '查询' })
    fireEvent.click(btn)
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalled()
  })

  test('error messages clear after valid input', () => {
    render(<TrainSearchBar />)
    const btn = screen.getByRole('button', { name: '查询' })
    fireEvent.click(btn)
    expect(screen.getByText('请填写出发地')).toBeTruthy()
    expect(screen.getByText('请填写到达地')).toBeTruthy()
    const from = screen.getByPlaceholderText('简拼/全拼/汉字')
    const to = screen.getByPlaceholderText('到达站')
    fireEvent.change(from, { target: { value: '北京' } })
    fireEvent.change(to, { target: { value: '上海' } })
    expect(screen.queryByText('请填写出发地')).toBeNull()
    expect(screen.queryByText('请填写到达地')).toBeNull()
  })
})