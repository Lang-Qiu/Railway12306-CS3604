import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import OrderPage from '../../pages/OrderPage';

// Mock child components to isolate layout testing
vi.mock('../../components/OrderHeader', () => ({ default: () => <div data-testid="order-header">Header</div> }));
vi.mock('../../components/TrainInfoSection', () => ({ default: () => <div data-testid="train-info">TrainInfo</div> }));
vi.mock('../../components/PassengerInfoSection', () => ({ default: () => <div data-testid="passenger-info">PassengerInfo</div> }));
vi.mock('../../components/OrderSubmitSection', () => ({ default: () => <div data-testid="order-submit">OrderSubmit</div> }));
vi.mock('../../components/OrderFooter', () => ({ default: () => <div data-testid="order-footer">OrderFooter</div> }));
vi.mock('../../components/ConfirmModal', () => ({ default: () => null }));
vi.mock('../../components/OrderConfirmationModal', () => ({ default: () => null }));

describe('REQ-ORDER-LAYOUT: Order Page Layout', () => {
  it('renders all main sections', () => {
    render(<OrderPage />);
    expect(screen.getByTestId('order-header')).toBeInTheDocument();
    expect(screen.getByTestId('train-info')).toBeInTheDocument();
    expect(screen.getByTestId('passenger-info')).toBeInTheDocument();
    expect(screen.getByTestId('order-submit')).toBeInTheDocument();
    expect(screen.getByTestId('order-footer')).toBeInTheDocument();
  });

  it('has correct background color and padding', () => {
    const { container } = render(<OrderPage />);
    const pageDiv = container.firstChild as HTMLElement;
    // Check if style attribute contains the expected values
    // React might normalize style strings, so we check for key parts
    expect(pageDiv.getAttribute('style')).toContain('background-color: white');
    expect(pageDiv.getAttribute('style')).toContain('padding: 0px 20px');
  });
});
