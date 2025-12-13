import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressManagementPage from '../../src/pages/AddressManagementPage'

describe('AddressManagementPage - 地址管理页', () => {
  test('Given 已登录用户 When 进入地址管理页 Then 布局包含顶部导航、左侧菜单、右侧展示面板', () => {
    render(<AddressManagementPage />)
    expect(screen.getByText('我的12306')).toBeInTheDocument()
    expect(screen.getByText('个人信息')).toBeInTheDocument()
    expect(screen.getByText('地址管理')).toBeInTheDocument()
  })

  test('Given 初始进入页面 When 加载完成 Then 显示地址列表与温馨提示区域', () => {
    render(<AddressManagementPage />)
    expect(screen.getByText('温馨提示')).toBeInTheDocument()
    expect(screen.getByText('添加')).toBeInTheDocument()
  })
})
