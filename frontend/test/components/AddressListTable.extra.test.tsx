import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressListTable from '../../src/components/AddressListTable'

describe('AddressListTable - 删除确认弹窗', () => {
  test('Given 用户在地址管理页 When 点击某行“删除” Then 弹窗显示确认内容与按钮', () => {
    render(<AddressListTable data={[{ id: 'ADDR-001' }]} />)
    expect(screen.getByText('您确定要删除选中的车票快递地址吗？')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
    expect(screen.getByText('确定')).toBeInTheDocument()
  })
})

