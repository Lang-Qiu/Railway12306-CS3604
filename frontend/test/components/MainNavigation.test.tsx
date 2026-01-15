import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MainNavigation from '../../src/components/MainNavigation'

describe('MainNavigation - 主导航栏组件', () => {
  const defaultProps = {
    isLoggedIn: false,
    onLoginClick: vi.fn(),
    onRegisterClick: vi.fn(),
    onPersonalCenterClick: vi.fn(),
  }

  const renderWithRouter = (component: React.ReactElement, initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        {component}
      </MemoryRouter>
    )
  }

  it('应该渲染首页链接', () => {
    renderWithRouter(<MainNavigation {...defaultProps} />)
    const homeLink = screen.getByText('首页')
    expect(homeLink).toBeInTheDocument()
  })

  it('鼠标悬停在车票上应该显示下拉菜单', () => {
    renderWithRouter(<MainNavigation {...defaultProps} />)
    
    // 初始状态下不应显示下拉菜单
    expect(screen.queryByText('单程')).not.toBeInTheDocument()

    // 悬停在车票上
    const ticketsItem = screen.getByText('车票').closest('.nav-item-wrapper')
    fireEvent.mouseEnter(ticketsItem!)

    // 应该显示下拉菜单
    expect(screen.getByText('单程')).toBeInTheDocument()
  })

  it('鼠标从车票移到首页应该立即关闭下拉菜单', () => {
    vi.useFakeTimers()
    renderWithRouter(<MainNavigation {...defaultProps} />)

    // 1. 打开车票下拉菜单
    const ticketsItem = screen.getByText('车票').closest('.nav-item-wrapper')
    fireEvent.mouseEnter(ticketsItem!)
    expect(screen.getByText('单程')).toBeInTheDocument()

    // 2. 移出车票（会设置100ms定时器）
    fireEvent.mouseLeave(ticketsItem!)
    
    // 此时下拉菜单应该还在（因为有延迟）
    expect(screen.getByText('单程')).toBeInTheDocument()

    // 3. 移入首页（应该立即清除定时器并关闭下拉菜单）
    const homeLink = screen.getByText('首页')
    fireEvent.mouseEnter(homeLink)

    // 验证下拉菜单立即消失
    expect(screen.queryByText('单程')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
