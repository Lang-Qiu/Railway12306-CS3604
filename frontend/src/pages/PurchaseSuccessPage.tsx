import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuccessBanner from '../components/SuccessBanner';
import SuccessOrderInfo from '../components/SuccessOrderInfo';
import SuccessWarmTips from '../components/SuccessWarmTips';
import { getOrderDetail } from '../api/orders';
import { Order } from '../types/Order';
import './PurchaseSuccessPage.css';

const PurchaseSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Ensure orderId is valid
        const parsedOrderId = orderId ? parseInt(orderId, 10) : NaN;

        if (isNaN(parsedOrderId)) {
            setError('订单号无效');
            return;
        }

        const response = await getOrderDetail(parsedOrderId);
        if (response.success && response.data) {
             const data = response.data;
             // Ensure price is number if it comes as string (just in case)
             if (data.passengers) {
                data.passengers = data.passengers.map((p: any) => ({
                    ...p,
                    price: Number(p.price)
                }));
             }
             setOrder(data);
        } else {
             setError(response.error || response.message || '获取订单信息失败');
        }
      } catch (err) {
        setError('获取订单信息失败');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return (
        <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
            <h2>获取订单信息失败</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/trains')}>返回首页</button>
        </div>
    );
  }

  return (
    <div className="purchase-success-page">
      
      <div className="purchase-success-content">
        <SuccessBanner order={order} />
        <SuccessOrderInfo order={order} />
        <SuccessWarmTips />
      </div>
      
    </div>
  );
};

export default PurchaseSuccessPage;
