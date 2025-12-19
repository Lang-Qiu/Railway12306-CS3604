import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PassengerInfoSection from '../../components/PassengerInfoSection';

// Mock children to focus on section layout
vi.mock('../../components/PassengerList', () => ({ default: () => <div data-testid="passenger-list">List</div> }));
vi.mock('../../components/PassengerSearch', () => ({ default: () => <div data-testid="passenger-search">Search</div> }));
vi.mock('../../components/PurchaseInfoTable', () => ({ default: () => <div data-testid="purchase-table">Table</div> }));

describe('REQ-ORDER-PASSENGER-INFO: Passenger Info Section', () => {
  const defaultProps = {
    passengers: [],
    selectedIds: [],
    onToggle: vi.fn(),
    seatOptions: [],
    seatSelections: {},
    onSeatChange: vi.fn(),
  };

  it('renders title bar with correct styles', () => {
    const { container } = render(<PassengerInfoSection {...defaultProps} />);
    const titleText = screen.getByText('乘客信息（填写说明）');
    const titleBar = titleText.parentElement; // The div with class title-bar
    // Check background gradient and text color
    expect(titleBar?.getAttribute('style')).toContain('background: linear-gradient(to right, #3698d5, #1d82bd)');
    expect(titleBar?.getAttribute('style')).toContain('color: white');
  });

  it('renders search box in title bar', () => {
    render(<PassengerInfoSection {...defaultProps} />);
    expect(screen.getByTestId('passenger-search')).toBeInTheDocument();
  });

  it('renders content area with white background', () => {
    const { container } = render(<PassengerInfoSection {...defaultProps} />);
    // This is tricky without specific class or id on content area, 
    // but we can look for the div containing the children
    const list = screen.getByTestId('passenger-list');
    const contentArea = list.parentElement;
    // Assuming content area has padding 15px 20px 0 20px
    // React style normalization might vary, checking background color is safer
    expect(contentArea?.getAttribute('style')).toContain('background-color: white'); 
    // Wait, PRD 5.1.4 says Content Area background white.
    // My previous implementation might have missed this or set it correctly.
  });
});
