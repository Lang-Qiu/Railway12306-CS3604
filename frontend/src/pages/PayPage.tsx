import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrderHeader from '../components/OrderHeader';
import OrderFooter from '../components/OrderFooter';
import PaymentNavMain from '../components/PaymentNavMain';
import PaymentCountdown from '../components/PaymentCountdown';
import OrderInfoDisplay from '../components/OrderInfoDisplay';
import WarmTipsPanel from '../components/WarmTipsPanel';
import CancelOrderModal from '../components/CancelOrderModal';
import TimeoutModal from '../components/TimeoutModal';

interface PayPageProps {}

const PayPage: React.FC<PayPageProps> = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    // TODO: Fetch order details using API
    // fetchOrderDetails(orderId).then(data => { setOrderData(data); setLoading(false); });
    
    // Mock data
    setOrderData({
        id: orderId || '12345',
        status: 'PENDING',
        expires_at: new Date(Date.now() + 20 * 60000).toISOString(),
        train: {
            train_no: 'G499',
            start_station: '上海虹桥',
            end_station: '杭州东',
            start_time: '11:00',
            end_time: '11:45',
            date: '2025-12-05 （周五）'
        },
        passengers: [
            { id: 1, name: '王小明', type: '成人票', id_no: '3301*******678', seat_type: '二等座', seat_no: '06Car07D', price: 73.0 }
        ],
        total_price: 73.0
    });
    setLoading(false);
  }, [orderId]);

  const handlePay = async () => {
    setIsPaying(true);
    // TODO: Call API for payment
    // await confirmPayment(orderId);
    
    setTimeout(() => {
        setIsPaying(false);
        const targetId = orderData?.id || orderId;
        if (!targetId) {
            console.error('Missing order ID for navigation');
            // Fallback or error handling
            return;
        }
        navigate(`/purchase-success/${targetId}`);
    }, 1000);
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    // TODO: Call API
    // await cancelOrder(orderId);
    setShowCancelModal(false);
    navigate('/trains');
  };

  // Callback for countdown expiration
  // Note: PaymentCountdown needs to expose an onExpire callback ideally, 
  // but for now we can rely on parent checking or passing a callback prop if we modify PaymentCountdown.
  // For strict compliance with PRD "Show TimeoutModal when countdown ends", we should pass a callback.
  // Let's assume PaymentCountdown will be updated or we check time here too.
  // Ideally, PaymentCountdown should accept an `onExpire` prop. 
  // Since I created PaymentCountdown, I should check if it has onExpire. It does NOT.
  // I will just use a simple timeout here matching the expires_at for the modal, 
  // or better, I should update PaymentCountdown to support onExpire.
  
  // For now, I'll simulate timeout modal trigger if needed, or rely on the fact that I should update PaymentCountdown.
  // Let's update PaymentCountdown to take onExpire.

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="payment-page-container" style={{ backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="payment-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
        {orderData && (
            <PaymentCountdown 
                expireTime={orderData.expires_at} 
                onExpire={() => setShowTimeoutModal(true)} 
            />
        )}

        {orderData && (
            <OrderInfoDisplay 
                orderData={orderData} 
                onCancel={handleCancelClick}
                onPay={handlePay}
                isPaying={isPaying}
            />
        )}

        <WarmTipsPanel />
      </div>

      <CancelOrderModal 
        visible={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />

      <TimeoutModal 
        visible={showTimeoutModal}
        onConfirm={() => navigate('/trains')}
      />
    </div>
  );
};

export default PayPage;
