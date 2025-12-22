import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import OrderSubmitSection from '../../components/OrderSubmitSection';

describe('REQ-ORDER-SUBMIT-SECTION: Submit Section', () => {
  it('renders submit button with correct color', () => {
    render(<OrderSubmitSection />);
    const submitBtn = screen.getByText('提交订单');
    // #fd8100 -> rgb(253, 129, 0)
    expect(submitBtn.getAttribute('style')).toContain('background: rgb(253, 129, 0)');
  });

  it('renders warm tips with yellow background', () => {
    const { container } = render(<OrderSubmitSection />);
    // Find warm tips div by text
    const tipsTitle = screen.getByText('温馨提示');
    const tipsDiv = tipsTitle.parentElement;
    // #fffbe5 -> rgb(255, 251, 229)
    expect(tipsDiv?.getAttribute('style')).toContain('background-color: rgb(255, 251, 229)');
  });
});
