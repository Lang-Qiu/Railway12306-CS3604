import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import ConfirmModal from '../../src/components/our12306/ConfirmModal'

describe('ConfirmModal - 尺寸控制', () => {
  test('Given 删除弹窗 When 显示 Then 宽度与头部高度变小', () => {
    const { container } = render(
      <ConfirmModal isVisible title="提示" message="您确定要删除选中的车票快递地址吗？" confirmText="确定" cancelText="取消" onConfirm={() => {}} onCancel={() => {}} />
    )
    const content = container.querySelector('.modal-content') as HTMLElement
    const header = container.querySelector('.modal-header') as HTMLElement
    expect(content).toBeTruthy()
    expect(header).toBeTruthy()
    expect(content.style.maxWidth).toBe('480px')
    expect(header.style.height).toBe('40px')
  })
})
