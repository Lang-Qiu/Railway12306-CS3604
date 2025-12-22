import React from 'react';
import { Order } from '../types/Order';

interface OrderInfoDisplayProps {
  orderData: Order;
  onCancel: () => void;
  onPay: () => void;
  isPaying: boolean;
}

const OrderInfoDisplay: React.FC<OrderInfoDisplayProps> = ({ orderData, onCancel, onPay, isPaying }) => {
  const { train, passengers, total_price } = orderData;

  const formatDate = (dateStr: string) => {
    if (dateStr.match(/[\u4e00-\u9fa5]/)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${dateStr} （${weekDay}）`;
  };

  return (
    <div className="payment-order-info-container" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="payment-order-info-display" style={{ 
        backgroundColor: 'white', 
        border: '1px solid #c0d7eb', 
        borderRadius: '10px 0px 10px 10px',
        marginTop: '20px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="payment-order-info-header" style={{
          background: 'linear-gradient(to right, #3698d5, #1d82bd)',
          borderRadius: '10px 10px 0px 0px',
          padding: '5px 20px',
          borderBottom: '2px solid #8fcdec',
          fontSize: '16px',
          fontWeight: 500,
          color: 'white',
          letterSpacing: '0.5px'
        }}>
          订单信息
        </div>

        {/* Content */}
        <div className="payment-order-info-content" style={{ padding: '20px 20px 0px 20px', backgroundColor: 'white' }}>
          
          {/* Train Info Row */}
          <div className="payment-train-info-row" style={{
            marginBottom: '20px',
            fontSize: '20px',
            color: '#333333',
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span style={{ fontWeight: 800, color: '#000000' }}>{formatDate(train.startDate)}</span>
            <span style={{ fontWeight: 800, color: '#000000' }}>{train.trainNumber}</span>
            <span style={{ fontWeight: 400, color: '#000000', fontSize: '16px' }}>次</span>
            <span style={{ fontWeight: 800, color: '#0066cc' }}>{train.startStation.name}</span>
            <span style={{ fontWeight: 400, color: '#000000', fontSize: '16px' }}>站</span>
            <span style={{ fontWeight: 800, color: '#000000' }}>（{train.startTime} 开）—</span>
            <span style={{ fontWeight: 800, color: '#0066cc' }}>{train.endStation.name}</span>
            <span style={{ fontWeight: 400, color: '#000000', fontSize: '16px' }}>站</span>
            <span style={{ fontWeight: 800, color: '#000000' }}>（{train.endTime} 到）</span>
          </div>

          {/* Passenger Table */}
          <div className="payment-passenger-table-container" style={{ padding: 0, marginTop: '12px', background: 'transparent' }}>
            <table className="payment-passenger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: 0 }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(to bottom, #ffffff, #d9d9d9)', 
                  fontWeight: 500, 
                  color: '#111',
                  borderTop: '1px solid #999999',
                  borderBottom: '1px solid #d0d0d0'
                }}>
                  {['序号', '姓名', '证件类型', '证件号码', '票种', '席别', '车厢', '席位号', '票价（元）'].map((head, idx) => (
                    <th key={idx} style={{ 
                      padding: '10px 8px', 
                      textAlign: 'center', 
                      borderLeft: idx === 0 ? '1px solid #d0d0d0' : 'none',
                      borderRight: idx === 8 ? '1px solid #d0d0d0' : 'none'
                    }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, index) => {
                  return (
                    <tr key={index} style={{ 
                      backgroundColor: '#eff1f9', 
                      color: '#111',
                      borderBottom: index === passengers.length - 1 ? '1px solid #999999' : '1px solid #d0d0d0'
                    }}>
                      <td style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid #d0d0d0' }}>{index + 1}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.name}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.idType}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.idNumber}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.ticketType}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.seatType}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.coachNumber}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.seatNumber}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #d0d0d0' }}>{p.price.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Insurance Section */}
          <div className="payment-insurance-section" style={{ padding: 0, marginTop: '20px', background: 'transparent', overflow: 'hidden' }}>
            <img src="/images/payment-decoration.png" alt="insurance" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          {/* Total Price Row */}
          <div className="payment-total-price-row" style={{ 
            padding: '12px 20px 15px 0', 
            textAlign: 'right', 
            background: 'transparent', 
            borderBottom: '1px solid #70a9d5' 
          }}>
            <span style={{ fontSize: '14px', color: '#333', marginRight: '10px' }}>总票价：</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#ff6600' }}>{total_price.toFixed(1)} 元</span>
          </div>

          {/* Action Buttons */}
          <div className="payment-actions" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '40px', 
            marginTop: '20px', 
            marginBottom: '20px',
            padding: 0 
          }}>
            <button 
              onClick={onCancel}
              style={{
                padding: '10px 40px',
                border: '1px solid #d0d0d0',
                borderRadius: '5px',
                fontSize: '15px',
                fontWeight: 500,
                minWidth: '140px',
                backgroundColor: 'white',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.borderColor = '#b0b0b0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d0d0d0'; }}
            >
              取消订单
            </button>
            <button 
              onClick={onPay}
              disabled={isPaying}
              style={{
                padding: '10px 40px',
                border: isPaying ? '1px solid #ff8533' : '1px solid #ff7200',
                borderRadius: '5px',
                fontSize: '15px',
                fontWeight: 500,
                minWidth: '140px',
                backgroundColor: isPaying ? '#ff8533' : '#ff7200',
                color: 'white',
                cursor: isPaying ? 'not-allowed' : 'pointer',
                opacity: isPaying ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if(!isPaying) { e.currentTarget.style.backgroundColor = '#ff8533'; e.currentTarget.style.borderColor = '#ff8533'; } }}
              onMouseLeave={(e) => { if(!isPaying) { e.currentTarget.style.backgroundColor = '#ff7200'; e.currentTarget.style.borderColor = '#ff7200'; } }}
            >
              {isPaying ? '处理中...' : '网上支付'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderInfoDisplay;