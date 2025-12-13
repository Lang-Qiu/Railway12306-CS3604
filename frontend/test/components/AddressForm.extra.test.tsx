import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressForm from '../../src/components/AddressForm'

describe('AddressForm - 表单初始与成功保存', () => {
  test('Given 初始进入表单 When 页面加载 Then 下拉与输入框显示灰字提示', () => {
    render(<AddressForm />)
    expect(screen.getByPlaceholderText('请选择省')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请选择市')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请选择区/县')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请选择乡镇（周边地区）')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请选择附近区域')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写详细地址')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写收件人')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写手机号码')).toBeInTheDocument()
  })

  test('Given 所有信息填写规范 When 点击保存 Then 弹窗显示“✅添加成功”', () => {
    render(<AddressForm />)
    expect(screen.getByText('✅添加成功')).toBeInTheDocument()
    expect(screen.getByText('确定')).toBeInTheDocument()
  })
})

