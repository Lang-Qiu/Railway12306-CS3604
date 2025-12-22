import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import OrderHeader from '../../components/OrderHeader';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('REQ-ORDER-NAV-TOP: Order Header', () => {
  it('renders logo area and welcome message', () => {
    render(
      <BrowserRouter>
        <OrderHeader />
      </BrowserRouter>
    );
    expect(screen.getByText('欢迎登录12306')).toBeInTheDocument();
    const logoImg = screen.getByAltText('中国铁路12306');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/images/login-page-top-nav-logo-area.png');
  });

  it('has correct styling for layout', () => {
    const { container } = render(
      <BrowserRouter>
        <OrderHeader />
      </BrowserRouter>
    );
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveStyle({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });
  });
});
