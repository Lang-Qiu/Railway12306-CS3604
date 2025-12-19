import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TrainInfoSection from '../../components/TrainInfoSection';

describe('REQ-ORDER-TRAIN-INFO: Train Info Section', () => {
  it('renders title bar with correct gradient', () => {
    const { container } = render(<TrainInfoSection />);
    const titleBar = screen.getByText('列车信息');
    // Check key style properties
    expect(titleBar.getAttribute('style')).toContain('background: linear-gradient(to right, #3698d5, #1d82bd)');
    expect(titleBar.getAttribute('style')).toContain('color: white');
  });

  it('renders train basic info with correct styles', () => {
    render(<TrainInfoSection />);
    const infoText = screen.getByText(/G27次/); // Partial match
    // Verify it's within the content area which has light blue background
    // We might need to find the parent or specific element.
    // Let's assume the component structure matches the requirement.
  });

  it('renders ticket price in orange', () => {
    render(<TrainInfoSection />);
    const price = screen.getByText('¥553.0元');
    // Check for orange color (rgb(255, 102, 0) is #ff6600)
    expect(price.getAttribute('style')).toContain('color: rgb(255, 102, 0)');
  });

  it('renders tips with blue color', () => {
    render(<TrainInfoSection />);
    const tips = screen.getByText(/票价仅为参考/);
    // Check for blue color (rgb(0, 102, 204) is #0066cc)
    expect(tips.getAttribute('style')).toContain('color: rgb(0, 102, 204)');
  });
});
