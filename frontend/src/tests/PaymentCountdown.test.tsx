import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PaymentCountdown from '../components/PaymentCountdown';
import React from 'react';

describe('PaymentCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders correctly with initial time', () => {
        const futureTime = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 mins
        render(<PaymentCountdown expireTime={futureTime} />);
        
        expect(screen.getByText(/席位已锁定/)).toBeInTheDocument();
        expect(screen.getByText('20分00秒')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', '/images/lock.png');
    });

    it('counts down', () => {
        const futureTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        render(<PaymentCountdown expireTime={futureTime} />);

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByText('19分59秒')).toBeInTheDocument();
    });

    it('shows warning style when less than 5 minutes', () => {
        const futureTime = new Date(Date.now() + 4 * 60 * 1000).toISOString(); // 4 mins
        const { container } = render(<PaymentCountdown expireTime={futureTime} />);

        const timeSpan = screen.getByText('04分00秒');
        // Check for red color #ff0000 (rgb(255, 0, 0))
        // Note: Inline styles might be applied.
        expect(timeSpan).toHaveStyle({ color: '#ff0000' });
    });

    it('shows expired style and calls onExpire when time is up', () => {
        const onExpire = vi.fn();
        const futureTime = new Date(Date.now() + 1000).toISOString(); // 1 sec
        const { container } = render(<PaymentCountdown expireTime={futureTime} onExpire={onExpire} />);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('00分00秒')).toBeInTheDocument();
        expect(onExpire).toHaveBeenCalled();
        
        // Check expired container style
        // We look for the container div
        const containerDiv = container.firstChild as HTMLElement;
        expect(containerDiv).toHaveStyle({ backgroundColor: '#fff3f3', borderColor: '#ffcccc' });
    });
});
