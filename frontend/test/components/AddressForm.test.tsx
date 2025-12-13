import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddressForm from '../../src/components/AddressForm'

describe('AddressForm - 地址表单', () => {
  test('Given 所在地址未完整选择 When 仅选择到省 Then 显示“❌请选择市！”', () => {
    render(<AddressForm />)
    fireEvent.change(screen.getByLabelText('省'), { target: { value: '上海' } })
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请选择市！')).toBeInTheDocument()
  })

  test('Given 所在地址未完整选择 When 仅选择到市 Then 显示“❌请选择区/县！”', () => {
    render(<AddressForm />)
    fireEvent.change(screen.getByLabelText('省'), { target: { value: '上海' } })
    fireEvent.change(screen.getByLabelText('市'), { target: { value: '上海市' } })
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请选择区/县！')).toBeInTheDocument()
  })

  test('Given 所在地址未完整选择 When 仅选择到区县 Then 显示“❌请选择请选择乡镇（周边地区）！”', () => {
    render(<AddressForm />)
    fireEvent.change(screen.getByLabelText('省'), { target: { value: '上海' } })
    fireEvent.change(screen.getByLabelText('市'), { target: { value: '上海市' } })
    fireEvent.change(screen.getByLabelText('区/县'), { target: { value: '闵行区' } })
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请选择请选择乡镇（周边地区）！')).toBeInTheDocument()
  })

  test('Given 详细地址为空 When 点击保存 Then 显示“❌请输入详细地址！”', () => {
    render(<AddressForm />)
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请输入详细地址！')).toBeInTheDocument()
  })

  test('Given 收件人为空 When 点击保存 Then 显示“❌请输入收件人姓名！”', () => {
    render(<AddressForm />)
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请输入收件人姓名！')).toBeInTheDocument()
  })

  test('Given 手机号为空 When 点击保存 Then 显示“❌请输入手机号！”', () => {
    render(<AddressForm />)
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌请输入手机号！')).toBeInTheDocument()
  })

  test('Given 手机号格式错误 When 点击保存 Then 显示“❌手机号格式不正确！”', () => {
    render(<AddressForm />)
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '123' } })
    fireEvent.click(screen.getByText('保存'))
    expect(screen.getByText('❌手机号格式不正确！')).toBeInTheDocument()
  })

  test('Given 用户点击“取消” When 表单模式 Then 返回列表模式', () => {
    render(<AddressForm />)
    fireEvent.click(screen.getByText('取消'))
    expect(screen.getByText('地址列表')).toBeInTheDocument()
  })
})
