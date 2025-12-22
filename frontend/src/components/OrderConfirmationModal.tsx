import React from 'react';
import { TrainData } from './TrainInfoSection';
import { Passenger } from './PassengerList';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  train?: TrainData;
  date?: string;
  passengers: Passenger[];
  seatSelections: { [key: number]: string };
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  train,
  date,
  passengers,
  seatSelections
}) => {
  if (!isOpen || !train) return null;

  return (
    <div className="order-confirmation-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white', width: '90%', maxWidth: '800px', maxHeight: '85vh',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', borderRadius: '4px', overflow: 'hidden'
      }}>
        <div className="modal-header" style={{
          background: 'linear-gradient(to right, #3aadf9, #249bf5)',
          padding: '8px 20px', borderBottom: '1px solid #7ac9f8',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
           <span style={{ fontSize: '18px', fontWeight: 600, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>请核对以下信息</span>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '28px', color: 'white', cursor: 'pointer' }}>×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '20px' }}>
           <div className="train-info-area" style={{ fontSize: '16px', marginBottom: '15px' }}>
               <strong>{date} {train.trainNo}次</strong> {train.departureStation}（{train.departureTime}开）— {train.arrivalStation}（{train.arrivalTime}到）
           </div>
           
           <div className="passenger-table-container" style={{ marginTop: '15px', border: '1px solid #d0d0d0', color: '#000000' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead style={{ background: '#f8f8f8', borderBottom: '1px solid #d0d0d0' }}>
                       <tr>
                           <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #eee' }}>序号</th>
                           <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #eee' }}>席别</th>
                           <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #eee' }}>票种</th>
                           <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #eee' }}>姓名</th>
                           <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #eee' }}>证件类型</th>
                           <th style={{ padding: '10px', textAlign: 'left' }}>证件号码</th>
                       </tr>
                   </thead>
                   <tbody>
                       {passengers.map((p, index) => (
                         <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                           <td style={{ padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                           <td style={{ padding: '10px' }}>{seatSelections[p.id]}</td>
                           <td style={{ padding: '10px' }}>成人票</td>
                           <td style={{ padding: '10px' }}>{p.name}</td>
                           <td style={{ padding: '10px' }}>居民身份证</td>
                           <td style={{ padding: '10px' }}>{p.id_card_number}</td>
                         </tr>
                       ))}
                   </tbody>
               </table>
           </div>
           
           <div className="notice" style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
               系统将随机为您申请席位，暂不支持自选席位
           </div>
           
           <div className="footer-area" style={{ marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
               <div className="tickets-left" style={{ textAlign: 'right', fontWeight: 600, color: '#333' }}>
                   {/* Mock availability display based on first selected seat type */}
                   {passengers.length > 0 && seatSelections[passengers[0].id] && (
                     <span>{seatSelections[passengers[0].id]}余票 <span style={{ color: '#d32f2f' }}>充足</span></span>
                   )}
               </div>
               <div className="buttons" style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '20px' }}>
                   <button onClick={onClose} style={{ 
                       minWidth: '150px', padding: '10px 40px', background: 'white', color: '#555', 
                       border: '1px solid #555', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' 
                   }}>返回修改</button>
                   <button onClick={onConfirm} style={{ 
                       minWidth: '150px', padding: '10px 40px', background: '#ff9500', color: 'white', 
                       border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' 
                   }}>确认</button>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;
