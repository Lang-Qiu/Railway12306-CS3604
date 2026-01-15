import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PhoneVerificationPage from '../../src/pages/PhoneVerificationPage';
import * as userApi from '../../src/api/user';

// Mock child components
vi.mock('../../src/components/TopNavigation', () => ({ default: () => <div data-testid="top-nav">TopNavigation</div> }));
vi.mock('../../src/components/CS3604_12306/BottomNavigation', () => ({ default: () => <div data-testid="bottom-nav">BottomNavigation</div> }));
vi.mock('../../src/components/SideMenu', () => ({ default: () => <div data-testid="side-menu">SideMenu</div> }));
vi.mock('../../src/components/BreadcrumbNavigation', () => ({ default: () => <div data-testid="breadcrumb">Breadcrumb</div> }));

describe('PhoneVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 initially', () => {
    render(
      <BrowserRouter>
        <PhoneVerificationPage />
      </BrowserRouter>
    );
    expect(screen.getByText('步骤 1：验证身份')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入登录密码')).toBeInTheDocument();
  });

  it('validates password and moves to step 2', async () => {
    const validateSpy = vi.spyOn(userApi, 'validatePassword').mockResolvedValue(true);
    render(
      <BrowserRouter>
        <PhoneVerificationPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('请输入登录密码'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('下一步'));

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith('password123');
      expect(screen.getByText('步骤 2：绑定新手机')).toBeInTheDocument();
    });
  });

  it('shows error on invalid password', async () => {
    const validateSpy = vi.spyOn(userApi, 'validatePassword').mockResolvedValue(false);
    render(
      <BrowserRouter>
        <PhoneVerificationPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('请输入登录密码'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('下一步'));

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith('wrongpass');
      expect(screen.getByText('密码错误')).toBeInTheDocument();
    });
  });

  it('handles verification code sending and phone update', async () => {
    // Start from step 2
    vi.spyOn(userApi, 'validatePassword').mockResolvedValue(true);
    const sendCodeSpy = vi.spyOn(userApi, 'sendChangePhoneCode').mockResolvedValue(undefined);
    const updatePhoneSpy = vi.spyOn(userApi, 'updateUserPhone').mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <PhoneVerificationPage />
      </BrowserRouter>
    );

    // Pass step 1
    fireEvent.change(screen.getByPlaceholderText('请输入登录密码'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('下一步'));
    await waitFor(() => expect(screen.getByText('步骤 2：绑定新手机')).toBeInTheDocument());

    // Step 2 interaction
    fireEvent.change(screen.getByPlaceholderText('请输入新手机号'), { target: { value: '13800009999' } });
    fireEvent.click(screen.getByText('获取验证码'));
    
    await waitFor(() => {
      expect(sendCodeSpy).toHaveBeenCalledWith('13800009999');
      expect(screen.getByText(/60s后重发/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('请输入6位验证码'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('完成'));

    await waitFor(() => {
      expect(updatePhoneSpy).toHaveBeenCalledWith('13800009999', '123456', 'password123');
      expect(screen.getByText('手机号修改成功')).toBeInTheDocument();
    });
  });
});
