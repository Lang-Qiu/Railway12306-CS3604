import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressTips from '../../src/components/AddressTips'

describe('AddressTips - 温馨提示区域', () => {
  test('Given 地址管理页 When 渲染提示区域 Then 显示“温馨提示”与限制说明', () => {
    render(<AddressTips />)
    expect(screen.getByText('温馨提示')).toBeInTheDocument()
    expect(screen.getByText(/最多可添加20个地址/)).toBeInTheDocument()
  })
})
