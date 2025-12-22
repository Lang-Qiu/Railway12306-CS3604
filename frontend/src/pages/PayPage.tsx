import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrderHeader from '../components/OrderHeader';
import OrderFooter from '../components/OrderFooter';
import PaymentCountdown from '../components/PaymentCountdown';
import OrderInfoDisplay from '../components/OrderInfoDisplay';
import WarmTipsPanel from '../components/WarmTipsPanel';
import CancelOrderModal from '../components/CancelOrderModal';
import TimeoutModal from '../components/TimeoutModal';
import { getOrderDetail } from '../api/orders';
import { Order } from '../types/Order';

interface PayPageProps {}

const PayPage: React.FC<PayPageProps> = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
        if (!orderId) {
            setError('缺少订单号');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getOrderDetail(Number(orderId));
            if (res.success && res.data) {
                setOrderData(res.data);
            } else {
                setError(res.error || '获取订单失败');
            }
        } catch (err) {
            setError('获取订单失败');
        } finally {
            setLoading(false);
        }
    };
    fetchOrder();
  }, [orderId]);

  const handlePay = async () => {
    setIsPaying(true);
    // Simulate payment API call
    // TODO: Call actual payment API
    setTimeout(() => {
        setIsPaying(false);
        if (orderData) {
            navigate(`/purchase-success/${orderData.id}`);
        }
    }, 1000);
  };

  const handleConfirmCancel = async () => {
    // TODO: Call API to cancel order
    setShowCancelModal(false);
    navigate('/trains');
  };

  if (loading) return <div>Loading...</div>;
  if (error || !orderData) return <div>{error || '订单不存在'}</div>;

  // Calculate expire time: created_at + 30 mins
  // If created_at is missing, default to now (should not happen with real data)
  const createdAt = orderData.created_at ? new Date(orderData.created_at).getTime() : Date.now();
  const expireTime = new Date(createdAt + 30 * 60 * 1000).toISOString();

  console.log('[PayPage Debug]', {
      orderId: orderData.id,
      createdAtRaw: orderData.created_at,
      createdAtParsed: new Date(createdAt).toISOString(),
      expireTime,
      now: new Date().toISOString(),
      diffMinutes: (new Date(expireTime).getTime() - Date.now()) / 1000 / 60
  });

  return (
    <div className="payment-page-container" style={{ backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OrderHeader />
      <div className="payment-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
        <PaymentCountdown 
            expireTime={expireTime} 
            onExpire={() => setShowTimeoutModal(true)} 
        />

        <OrderInfoDisplay 
            orderData={orderData} 
            onCancel={() => setShowCancelModal(true)}
            onPay={handlePay}
            isPaying={isPaying}
        />

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
      <OrderFooter />
    </div>
  );
};

export default PayPage;
