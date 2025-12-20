import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types/Order';
import './SuccessOrderInfo.css';

interface SuccessOrderInfoProps {
  order: Order | null;
}

const SuccessOrderInfo: React.FC<SuccessOrderInfoProps> = ({ order }) => {
  const navigate = useNavigate();

  if (!order) return null;

  const { train, passengers } = order;

  // Helper to format date "2025-12-05 （周五）"
  // Assuming startDate is "YYYY-MM-DD"
  const formatDate = (dateStr: string) => {
    // Handle cases where dateStr might already have day of week or be invalid
    if (dateStr.match(/[\u4e00-\u9fa5]/)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${dateStr} （${weekDay}）`;
  };

  return (
    <div className="success-order-info-container">
      <div className="success-order-info-display">
        <div className="success-order-info-header">
          订单信息
        </div>
        
        <div className="success-order-info-content">
          <div className="success-train-info-row">
            <span className="success-train-date">{formatDate(train.startDate)}</span>
            <span className="success-train-no">{train.trainNumber}</span>
            <span className="success-train-text">次</span>
            <span className="success-train-station">{train.startStation.name}</span>
            <span className="success-train-text">站</span>
            <span className="success-train-bold-group">（{train.startTime} 开）—</span>
            <span className="success-train-station">{train.endStation.name}</span>
            <span className="success-train-text">站</span>
            <span className="success-train-bold-group">（{train.endTime} 到）</span>
          </div>

          <div className="success-passenger-table-container">
            <table className="success-passenger-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>姓名</th>
                  <th>证件类型</th>
                  <th>证件号码</th>
                  <th>票种</th>
                  <th>席别</th>
                  <th>车厢</th>
                  <th>席位号</th>
                  <th>票价（元）</th>
                  <th>订单状态</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.idType}</td>
                    <td>{p.idNumber}</td>
                    <td>{p.ticketType}</td>
                    <td>{p.seatType}</td>
                    <td>{p.coachNumber}</td>
                    <td>{p.seatNumber}</td>
                    <td>{p.price.toFixed(1)}元</td>
                    <td className="status-paid">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="success-order-actions">
            <button className="food-button">餐饮·特产</button>
            <button 
              className="continue-button"
              onClick={() => navigate('/trains')}
            >
              继续购票
            </button>
            <button 
              className="view-details-button"
              onClick={() => navigate('/orders', { state: { orderId: order.id } })}
            >
              查询订单详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessOrderInfo;
