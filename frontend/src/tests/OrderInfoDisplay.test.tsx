import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderInfoDisplay from '../components/OrderInfoDisplay';
import React from 'react';

const mockOrderData = {
    id: '12345',
    status: 'PENDING',
    expires_at: new Date().toISOString(),
    train: {
        train_no: 'G499',
        start_station: '上海虹桥',
        end_station: '杭州东',
        start_time: '11:00',
        end_time: '11:45',
        date: '2025-12-05 （周五）'
    },
    passengers: [
        { id: 1, name: '王小明', type: '成人票', id_no: '3301*******678', seat_type: '二等座', seat_no: '06Car07D', price: 73.0 },
        { id: 2, name: '李小红', type: '成人票', id_no: '3302*******789', seat_type: '二等座', seat_no: '06Car07F', price: 73.0 }
    ],
    total_price: 146.0
};

describe('OrderInfoDisplay', () => {
    it('renders train info correctly', () => {
        render(<OrderInfoDisplay orderData={mockOrderData} onCancel={() => {}} onPay={() => {}} isPaying={false} />);
        
        expect(screen.getByText('G499')).toBeInTheDocument();
        expect(screen.getByText('上海虹桥')).toBeInTheDocument();
        expect(screen.getByText('杭州东')).toBeInTheDocument();
        expect(screen.getByText(/2025-12-05/)).toBeInTheDocument();
    });

    it('renders passenger list correctly', () => {
        render(<OrderInfoDisplay orderData={mockOrderData} onCancel={() => {}} onPay={() => {}} isPaying={false} />);
        
        expect(screen.getByText('王小明')).toBeInTheDocument();
        expect(screen.getByText('3301*******678')).toBeInTheDocument();
        
        const coachElements = screen.getAllByText('06车');
        expect(coachElements).toHaveLength(2);

        expect(screen.getByText('07D号')).toBeInTheDocument();
        
        expect(screen.getByText('李小红')).toBeInTheDocument();
        expect(screen.getByText('07F号')).toBeInTheDocument();
    });

    it('renders total price correctly', () => {
        render(<OrderInfoDisplay orderData={mockOrderData} onCancel={() => {}} onPay={() => {}} isPaying={false} />);
        
        expect(screen.getByText('146.0 元')).toBeInTheDocument();
    });

    it('triggers action buttons', () => {
        const onCancel = vi.fn();
        const onPay = vi.fn();
        render(<OrderInfoDisplay orderData={mockOrderData} onCancel={onCancel} onPay={onPay} isPaying={false} />);
        
        fireEvent.click(screen.getByText('取消订单'));
        expect(onCancel).toHaveBeenCalled();

        fireEvent.click(screen.getByText('网上支付'));
        expect(onPay).toHaveBeenCalled();
    });

    it('shows loading state on pay button', () => {
        render(<OrderInfoDisplay orderData={mockOrderData} onCancel={() => {}} onPay={() => {}} isPaying={true} />);
        
        expect(screen.getByText('处理中...')).toBeInTheDocument();
        const button = screen.getByText('处理中...').closest('button');
        expect(button).toBeDisabled();
    });
});
