import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PurchaseSuccessPage from '../../pages/PurchaseSuccessPage';
import { getOrderDetail } from '../../api/orders';

// Mock layout components to simplify test
vi.mock('../../components/OrderHeader', () => ({
  default: () => <div data-testid="order-header">OrderHeader</div>
}));
vi.mock('../../components/PaymentNavMain', () => ({
  default: () => <div data-testid="payment-nav-main">PaymentNavMain</div>
}));
vi.mock('../../components/OrderFooter', () => ({
  default: () => <div data-testid="order-footer">OrderFooter</div>
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
    useParams: () => ({
      orderId: '1234567890'
    })
  };
});

// Mock API
vi.mock('../../api/orders', () => ({
  getOrderDetail: vi.fn()
}));

describe('PurchaseSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (getOrderDetail as any).mockResolvedValue({
      success: true,
      data: {
        id: '1234567890',
        orderNumber: 'EA12345678',
        train: {
          trainNumber: 'G499',
          startStation: { name: '上海虹桥' },
          endStation: { name: '杭州东' },
          startTime: '11:00',
          endTime: '11:45',
          startDate: '2025-12-05'
        },
        passengers: [
          {
            name: '张三',
            idType: '中国居民身份证',
            idNumber: '3301*******028',
            ticketType: '成人票',
            seatType: '二等座',
            coachNumber: '06车',
            seatNumber: '07D号',
            price: 73.0,
            status: '已支付'
          }
        ]
      }
    });
  });

  it('renders loading state initially', () => {
    // Make promise not resolve immediately to catch loading state
    (getOrderDetail as any).mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <PurchaseSuccessPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders success content after loading', async () => {
    render(
      <MemoryRouter>
        <PurchaseSuccessPage />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Check Layout components
    expect(screen.getByTestId('order-header')).toBeInTheDocument();
    expect(screen.getByTestId('payment-nav-main')).toBeInTheDocument();
    expect(screen.getByTestId('order-footer')).toBeInTheDocument();

    // Check SuccessBanner content
    expect(screen.getByText('交易已成功！')).toBeInTheDocument();
    expect(screen.getByText('感谢您选择铁路出行！')).toBeInTheDocument();
    
    // Check Order ID
    expect(screen.getByText(/EA12345678/)).toBeInTheDocument();

    // Check Passenger info
    const names = screen.getAllByText(/张三/);
    expect(names.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3301\*\*\*\*\*\*\*028/).length).toBeGreaterThan(0);
    
    // Check Train Info
    expect(screen.getByText('G499')).toBeInTheDocument();
    expect(screen.getByText('上海虹桥')).toBeInTheDocument();
    expect(screen.getByText('杭州东')).toBeInTheDocument();

    // Check Warm Tips
    expect(screen.getByText(/温馨提示/)).toBeInTheDocument();
  });

  it('renders error message on api failure', async () => {
    (getOrderDetail as any).mockResolvedValue({
      success: false,
      error: 'Backend Error'
    });

    render(
      <MemoryRouter>
        <PurchaseSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Backend Error')).toBeInTheDocument();
  });
});
