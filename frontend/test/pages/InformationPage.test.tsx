import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InformationPage from '../../src/pages/InformationPage';
import * as userApi from '../../src/api/user';

// Mock child components to focus on page logic
vi.mock('../../src/components/TopNavigation', () => ({ default: () => <div data-testid="top-nav">TopNavigation</div> }));
vi.mock('../../src/components/CS3604_12306/BottomNavigation', () => ({ default: () => <div data-testid="bottom-nav">BottomNavigation</div> }));
vi.mock('../../src/components/SideMenu', () => ({ default: () => <div data-testid="side-menu">SideMenu</div> }));
vi.mock('../../src/components/BreadcrumbNavigation', () => ({ default: ({ items }: any) => <div data-testid="breadcrumb">{JSON.stringify(items)}</div> }));

// Mock PersonalInfoPanel to simplify page testing (or we can use real one for integration)
// Using real one for integration test of the page
// vi.mock('../../src/components/PersonalInfoPanel', () => ({ default: ({ user }: any) => <div data-testid="info-panel">{user.username}</div> }));

const mockUser = {
  id: '12345',
  username: 'zhangsan',
  name: '张三',
  idType: '1',
  idNumber: '110101199003078888',
  verificationStatus: '已通过',
  phone: '13812345678',
  email: 'zhangsan@example.com',
  discountType: '成人',
};

describe('InformationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockImplementation(() => new Promise(() => {})); // Never resolves
    render(
      <BrowserRouter>
        <InformationPage />
      </BrowserRouter>
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders user information after loading', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockUser);
    render(
      <BrowserRouter>
        <InformationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('zhangsan')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockRejectedValue(new Error('Failed to fetch'));
    render(
      <BrowserRouter>
        <InformationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('获取用户信息失败')).toBeInTheDocument();
    });
  });
});
