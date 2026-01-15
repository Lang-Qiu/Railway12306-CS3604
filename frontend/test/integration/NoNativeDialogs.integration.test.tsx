import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import RegisterPage from '../../src/pages/RegisterPage'

vi.mock('axios')
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> }

describe('无原生弹窗验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 监控原生弹窗
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    vi.spyOn(window, 'prompt').mockImplementation(() => null)
  })

  it('关闭验证弹窗时不触发原生confirm，并显示自定义确认弹窗', async () => {
    mockedAxios.post = vi.fn((url: string) => {
      if (url === '/api/register') {
        return Promise.resolve({ data: { sessionId: 'sess-123' } })
      }
      if (url === '/api/register/send-verification-code') {
        return Promise.resolve({ data: { message: '验证码发送成功', verificationCode: '123456' } })
      }
      return Promise.resolve({ data: { valid: true } })
    }) as any

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    )

    // 填表并提交，触发弹窗
    await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
    await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或符号/), 'Test123_')
    await userEvent.type(screen.getByPlaceholderText(/请再次输入您的登录密码/), 'Test123_')
    await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
    await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011237')
    await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    await waitFor(() => {
      expect(screen.getByText('手机验证')).toBeInTheDocument()
    })

    // 点击右上角关闭
    fireEvent.click(screen.getByLabelText('关闭'))

    await waitFor(() => {
      expect(screen.getByText('提示')).toBeInTheDocument()
      expect(screen.getByText(/确定要关闭验证弹窗/)).toBeInTheDocument()
    })

    // 原生confirm不应被调用
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('API错误时不触发原生alert，显示页面级错误提示', async () => {
    mockedAxios.post = vi.fn((url: string) => {
      if (url === '/api/register') {
        return Promise.reject({ response: { data: { error: '该用户名已经占用' } } })
      }
      return Promise.resolve({ data: { valid: true } })
    }) as any

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    )

    await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'dupuser')
    await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或符号/), 'Test123_')
    await userEvent.type(screen.getByPlaceholderText(/请再次输入您的登录密码/), 'Test123_')
    await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
    await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011237')
    await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    await waitFor(() => {
      expect(screen.getByText('该用户名已经占用')).toBeInTheDocument()
    })

    expect(window.alert).not.toHaveBeenCalled()
  })
})