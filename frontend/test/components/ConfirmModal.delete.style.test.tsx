import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfirmModal from '../../src/components/our12306/ConfirmModal'

describe('ConfirmModal - 删除弹窗样式与结构', () => {
  test('Given 删除确认弹窗 When 显示 Then 头部蓝色标题与关闭按钮存在', () => {
    const { container } = render(<ConfirmModal isVisible title="提示" message="您确定要删除选中的车票快递地址吗？" confirmText="确定" cancelText="取消" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('提示')).toBeInTheDocument()
    expect(screen.getByLabelText('关闭')).toBeInTheDocument()
    const header = container.querySelector('.modal-header')
    expect(header).toBeTruthy()
  })

  test('Given 删除确认弹窗 When 显示 Then 显示黄色问号图标与文案', () => {
    render(<ConfirmModal isVisible title="提示" message="您确定要删除选中的车票快递地址吗？" confirmText="确定" cancelText="取消" onConfirm={() => {}} onCancel={() => {}} />)
    const icon = screen.getByTestId('question-icon')
    expect(icon).toBeInTheDocument()
    expect(icon.textContent).toBe('?')
    expect(screen.getByText('您确定要删除选中的车票快递地址吗？')).toBeInTheDocument()
  })

  test('Given 删除确认弹窗 When 显示 Then 底部按钮取消在左确定在右且类名正确', () => {
    const { container } = render(<ConfirmModal isVisible title="提示" message="您确定要删除选中的车票快递地址吗？" confirmText="确定" cancelText="取消" onConfirm={() => {}} onCancel={() => {}} />)
    const footer = container.querySelector('.modal-footer') as HTMLElement
    expect(footer).toBeTruthy()
    const buttons = Array.from(footer.querySelectorAll('button'))
    expect(buttons.length).toBe(2)
    expect(buttons[0].textContent).toBe('取消')
    expect(buttons[0].className).toContain('cancel-button')
    expect(buttons[1].textContent).toBe('确定')
    expect(buttons[1].className).toContain('confirm-button')
  })
})
