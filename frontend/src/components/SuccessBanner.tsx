import React from 'react';
import './SuccessBanner.css';

interface Passenger {
  name: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  passengers: Passenger[];
}

interface SuccessBannerProps {
  order: Order | null;
}

const SuccessBanner: React.FC<SuccessBannerProps> = ({ order }) => {
  if (!order) return null;

  const orderNo = order.orderNumber || order.id || 'EA00000000';
  // If order number doesn't start with EA, prepend it (just for display logic matching PRD if needed, 
  // but usually backend sends correct format. PRD says "Format EA + 8 chars from Order ID")
  // Let's assume the prop passed is already formatted or we format it here.
  // For now, simple display.

  return (
    <div className="success-banner">
      <img src="/images/tick.png" alt="Success" className="success-icon" />
      
      <div className="success-content">
        <div className="success-title-row">
          <span className="success-title">交易已成功！</span>
          <span className="success-thanks">感谢您选择铁路出行！</span>
          <span className="success-order-info">您的订单号：</span>
          <span className="order-number">{orderNo}</span>
        </div>

        <div className="success-passenger-info">
          {order.passengers.map((p, index) => (
            <div key={index} className="passenger-name">
              {p.name} 女士/先生可持购票时所使用的中国居民身份证原件于购票后、列车开车前到车站直接检票乘车。
            </div>
          ))}
        </div>

        <div className="success-notification-info">
          消息通知方式进行相关调整，将通过"铁路12306"App客户端为您推送相关消息（需开启接收推送权限）。您也可以扫描关注下方"铁路12306"微信公众号或支付宝生活号二维码，选择通过微信或支付宝接收。
        </div>
      </div>
    </div>
  );
};

export default SuccessBanner;
