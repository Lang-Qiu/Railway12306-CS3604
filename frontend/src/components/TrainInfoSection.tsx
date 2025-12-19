import React from 'react';

export interface TrainData {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  prices?: {
    business?: number;
    firstClass?: number;
    secondClass?: number;
    noSeat?: number;
  };
  availableSeats?: {
    [key: string]: number | null;
  };
}

interface TrainInfoSectionProps {
  train?: TrainData;
  date?: string;
}

const TrainInfoSection: React.FC<TrainInfoSectionProps> = ({ train, date }) => {
  if (!train) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return `${dateStr}（${w}）`;
  };

  const seats = [
    { type: '商务座', price: train.prices?.business, count: train.availableSeats?.['商务座'] },
    { type: '一等座', price: train.prices?.firstClass, count: train.availableSeats?.['一等座'] },
    { type: '二等座', price: train.prices?.secondClass, count: train.availableSeats?.['二等座'] },
    { type: '无座', price: train.prices?.noSeat, count: train.availableSeats?.['无座'] },
  ].filter(s => s.price !== undefined && s.price !== null);

  const getStatus = (count: number | null | undefined) => {
    if (count === undefined || count === null) return '--';
    if (count === 0) return '无票';
    if (count >= 20) return '有票';
    return `${count}张`;
  };

  return (
    <div className="train-info-section" style={{ 
      backgroundColor: 'white', 
      borderRadius: '10px', 
      marginTop: '20px', 
      maxWidth: '1100px',
      border: '1px solid #c0d7eb'
    }}>
      <div className="title-bar" style={{
        background: 'linear-gradient(to right, #3698d5, #1d82bd)',
        borderRadius: '10px 10px 0 0',
        padding: '5px 20px',
        borderBottom: '1px solid #8fcdec',
        fontSize: '16px',
        fontWeight: 500,
        color: 'white',
        letterSpacing: '0.5px'
      }}>
        列车信息
      </div>
      <div className="content-area" style={{ padding: '10px 20px', backgroundColor: '#eef1fa', borderRadius: '0 0 10px 10px' }}>
        <div className="train-basic-info" style={{ fontSize: '20px', color: '#333333', lineHeight: '20px' }}>
          <strong style={{ fontWeight: 800, color: '#000000' }}>{formatDate(date)} {train.trainNo}次</strong> 
          <span style={{ fontWeight: 800, color: '#000000' }}> {train.departureStation}（{train.departureTime}开）— {train.arrivalStation}（{train.arrivalTime}到）</span>
        </div>
        
        <div className="ticket-info" style={{ marginTop: '12px', borderTop: '1px dashed #cecece', paddingTop: '10px', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
           {seats.map(seat => (
             <div key={seat.type} className="seat-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
               <span className="seat-type" style={{ fontSize: '14px', color: '#333333', fontWeight: 400 }}>{seat.type}</span>
               <span className="price" style={{ fontSize: '14px', color: '#ff6600', fontWeight: 600 }}>¥{seat.price}元</span>
               <span className="status" style={{ fontSize: '14px', color: '#333333', fontWeight: 400 }}>{getStatus(seat.count)}</span>
             </div>
           ))}
        </div>
        
        <div className="tips" style={{ marginTop: '5px', fontSize: '13px', color: '#0066cc', lineHeight: '20px' }}>
          * 票价仅为参考，最终以实际出票为准
        </div>
      </div>
    </div>
  );
};

export default TrainInfoSection;
