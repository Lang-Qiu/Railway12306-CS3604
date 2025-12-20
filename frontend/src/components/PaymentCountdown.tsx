import React, { useEffect, useState } from 'react';

interface PaymentCountdownProps {
  expireTime: string; // ISO string
  onExpire?: () => void;
}

const PaymentCountdown: React.FC<PaymentCountdownProps> = ({ expireTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(expireTime).getTime();
      const difference = end - now;
      
      console.debug('[Countdown]', { expireTime, now: new Date(now).toISOString(), difference });

      if (difference <= 0) {
        if (!isExpired) {
          setIsExpired(true);
          setTimeLeft({ minutes: 0, seconds: 0 });
          if (onExpire) onExpire();
        }
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ minutes, seconds });

      if (minutes < 5) {
        setIsWarning(true);
      } else {
        setIsWarning(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expireTime]);

  if (!timeLeft) return null;

  return (
    <div className={`payment-countdown-container ${isExpired ? 'expired' : ''}`} style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 40px',
      backgroundColor: isExpired ? '#fff3f3' : 'white',
      border: `1px solid ${isExpired ? '#ffcccc' : '#69afdd'}`,
      marginBottom: '20px',
      maxWidth: '1100px',
      width: '100%',
      justifyContent: 'center',
      gap: '20px'
    }}>
      <img src="/images/lock.png" alt="lock" style={{ width: '40px', height: '40px', flexShrink: 0 }} />
      
      <div style={{ flex: 1, fontSize: '16px', color: '#000', lineHeight: 1.6 }}>
        席位已锁定，请在提示时间内尽快完成支付，完成网上购票。支付剩余时间：
        <span style={{
          fontWeight: 800,
          color: isExpired || isWarning ? '#ff0000' : '#ff6600',
          fontSize: '16px',
          marginLeft: '5px',
          animation: isWarning && !isExpired ? 'pulse 1s infinite' : 'none'
        }}>
          {String(timeLeft.minutes).padStart(2, '0')}分{String(timeLeft.seconds).padStart(2, '0')}秒
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PaymentCountdown;
