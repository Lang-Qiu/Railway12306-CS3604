import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddressListTable from '../../src/components/AddressListTable'

describe('AddressListTable - 地址列表表格', () => {
  test('Given 初始数据为空 When 渲染 Then 显示列头：收件人、手机号、所在地址、详细地址、操作', () => {
    render(<AddressListTable />)
    expect(screen.getByText('收件人')).toBeInTheDocument()
    expect(screen.getByText('手机号')).toBeInTheDocument()
    expect(screen.getByText('所在地址')).toBeInTheDocument()
    expect(screen.getByText('详细地址')).toBeInTheDocument()
    expect(screen.getByText('操作')).toBeInTheDocument()
  })

  test('Given 有地址数据 When 渲染 Then 支持“编辑”“删除”操作按钮', () => {
    render(<AddressListTable data={[{ id: 'A1' }]} />)
    expect(screen.getByText('编辑')).toBeInTheDocument()
    expect(screen.getByText('删除')).toBeInTheDocument()
  })

  test('Given 点击添加按钮 When 触发事件 Then 切换到表单模式', () => {
    const onAdd = () => {}
    render(<AddressListTable onAdd={onAdd} />)
    fireEvent.click(screen.getByText('添加'))
    expect(screen.getByText('保存')).toBeInTheDocument()
  })
})
