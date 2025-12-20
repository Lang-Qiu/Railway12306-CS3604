import React, { useEffect, useState } from 'react';
import { listOrders } from '../api/orders';
import { Order } from '../types/Order';
import './OrderHistoryPage.css';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true); 
      setError('');
      try { 
        const res = await listOrders(); 
        if (res.success && Array.isArray(res.orders)) {
            setOrders(res.orders);
        } else {
            setError(res.message || '获取订单列表失败');
        }
      } catch (e) { 
        setError('获取订单列表失败'); 
        console.error(e);
      } finally { 
        setLoading(false); 
      }
    };
    run();
  }, []);

  return (
    <div className="order-history-page">
      <div style={{ padding: 16 }}>
        <h2>我的订单</h2>
        {loading && <div>加载中...</div>}
        {error && <div>{error}</div>}
        {!loading && !error && (
          <table>
            <thead>
                <tr>
                    <th>订单号</th>
                    <th>车次</th>
                    <th>出发</th>
                    <th>到达</th>
                    <th>日期</th>
                    <th>席别</th>
                    <th>数量</th>
                    <th>总价</th>
                    <th>状态</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((o) => (
                    <tr key={o.id}>
                        <td>{o.orderNumber}</td>
                        <td>{o.train.trainNumber}</td>
                        <td>{o.train.startStation.name}</td>
                        <td>{o.train.endStation.name}</td>
                        <td>{o.train.startDate}</td>
                        <td>{Array.from(new Set(o.passengers.map(p => p.seatType))).join(', ')}</td>
                        <td>{o.passengers.length}</td>
                        <td>{o.total_price.toFixed(1)}</td>
                        <td>{o.status}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
