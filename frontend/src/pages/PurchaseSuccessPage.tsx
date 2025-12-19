import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrderHeader from '../components/OrderHeader';
import PaymentNavMain from '../components/PaymentNavMain';
import OrderFooter from '../components/OrderFooter';
import SuccessBanner from '../components/SuccessBanner';
import SuccessOrderInfo from '../components/SuccessOrderInfo';
import SuccessWarmTips from '../components/SuccessWarmTips';
import { getOrderDetail } from '../api/orders';
import './PurchaseSuccessPage.css';

interface Order {
  id: string;
  orderNumber?: string;
  train: {
    trainNumber: string;
    startStation: { name: string };
    endStation: { name: string };
    startTime: string;
    endTime: string;
    startDate: string;
  };
  passengers: {
    name: string;
    idType: string;
    idNumber: string;
    ticketType: string;
    seatType: string;
    coachNumber: string;
    seatNumber: string;
    price: number;
    status: string;
  }[];
}

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
            // Fallback mock data if no valid orderId provided
            console.warn('Invalid or missing orderId, using mock data');
            const mockOrder: Order = {
              id: 'EA12345678',
              orderNumber: 'EA12345678',
              train: {
                trainNumber: 'G499',
                startStation: { name: '上海虹桥' },
                endStation: { name: '杭州东' },
                startTime: '11:00',
                endTime: '11:45',
                startDate: '2025-12-05'
              },
              passengers: [
                {
                  name: '张三',
                  idType: '中国居民身份证',
                  idNumber: '3301*******028',
                  ticketType: '成人票',
                  seatType: '二等座',
                  coachNumber: '06车',
                  seatNumber: '07D号',
                  price: 73.0,
                  status: '已支付'
                }
              ]
            };
            setOrder(mockOrder);
            return;
        }

        const response = await getOrderDetail(parsedOrderId);
        if (response.success && response.data) {
             // Ensure data types are correct, especially price
             const data = response.data;
             if (data.passengers) {
                data.passengers = data.passengers.map((p: any) => ({
                    ...p,
                    price: Number(p.price) // Ensure price is a number
                }));
             }
             setOrder(data);
        } else {
             setError(response.error || '获取订单信息失败');
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
      <OrderHeader />
      <PaymentNavMain />
      
      <div className="purchase-success-content">
        <SuccessBanner order={order} />
        <SuccessOrderInfo order={order} />
        <SuccessWarmTips />
      </div>
      
      <OrderFooter />
    </div>
  );
};

export default PurchaseSuccessPage;
