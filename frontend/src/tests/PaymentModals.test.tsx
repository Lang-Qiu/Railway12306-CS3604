import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CancelOrderModal from '../components/CancelOrderModal';
import TimeoutModal from '../components/TimeoutModal';
import UnfinishedOrderModal from '../components/UnfinishedOrderModal';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

describe('CancelOrderModal', () => {
    it('renders correctly when visible', () => {
        render(<CancelOrderModal visible={true} onCancel={() => {}} onConfirm={() => {}} />);
        expect(screen.getByText('交易提示')).toBeInTheDocument();
        expect(screen.getByText('您确认取消订单吗？')).toBeInTheDocument();
        expect(screen.getByText(/一天内3次申请车票成功后/)).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', '/images/question.png');
    });

    it('does not render when hidden', () => {
        render(<CancelOrderModal visible={false} onCancel={() => {}} onConfirm={() => {}} />);
        expect(screen.queryByText('交易提示')).not.toBeInTheDocument();
    });

    it('triggers callbacks', () => {
        const onCancel = vi.fn();
        const onConfirm = vi.fn();
        render(<CancelOrderModal visible={true} onCancel={onCancel} onConfirm={onConfirm} />);
        
        fireEvent.click(screen.getByText('取消'));
        expect(onCancel).toHaveBeenCalled();

        fireEvent.click(screen.getByText('确认'));
        expect(onConfirm).toHaveBeenCalled();
    });
});

describe('TimeoutModal', () => {
    it('renders correctly', () => {
        render(<TimeoutModal visible={true} onConfirm={() => {}} />);
        expect(screen.getByText('支付超时，请重新购票')).toBeInTheDocument();
    });

    it('triggers confirm callback', () => {
        const onConfirm = vi.fn();
        render(<TimeoutModal visible={true} onConfirm={onConfirm} />);
        
        fireEvent.click(screen.getByText('确认'));
        expect(onConfirm).toHaveBeenCalled();
    });
});

describe('UnfinishedOrderModal', () => {
    it('renders correctly with link', () => {
        render(
            <BrowserRouter>
                <UnfinishedOrderModal visible={true} onConfirm={() => {}} />
            </BrowserRouter>
        );
        expect(screen.getByText(/您还有未处理的订单/)).toBeInTheDocument();
        expect(screen.getByText('[未完成订单]')).toHaveAttribute('href', '/orders/unfinished');
    });
});
