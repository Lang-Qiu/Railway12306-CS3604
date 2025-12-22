import React from 'react';
import PassengerList, { Passenger } from './PassengerList';
import PassengerSearch from './PassengerSearch';
import PurchaseInfoTable from './PurchaseInfoTable';

interface SeatOption {
  label: string;
  value: string;
  price?: number;
}

interface PassengerInfoSectionProps {
  passengers: Passenger[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  seatOptions: SeatOption[];
  seatSelections: { [key: number]: string };
  onSeatChange: (id: number, seatType: string) => void;
}

const PassengerInfoSection: React.FC<PassengerInfoSectionProps> = ({ 
  passengers, 
  selectedIds, 
  onToggle, 
  seatOptions, 
  seatSelections, 
  onSeatChange 
}) => {
  return (
    <div className="passenger-info-section" style={{ 
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
        color: 'white',
        fontSize: '16px',
        fontWeight: 500,
        letterSpacing: '0.5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>乘客信息（填写说明）</span>
        <PassengerSearch />
      </div>
      <div className="content-area" style={{ padding: '15px 20px 0 20px', backgroundColor: 'white' }}>
        <PassengerList passengers={passengers} selectedIds={selectedIds} onToggle={onToggle} />
        <PurchaseInfoTable 
          selectedPassengers={passengers.filter(p => selectedIds.includes(p.id))} 
          seatOptions={seatOptions}
          seatSelections={seatSelections}
          onSeatChange={onSeatChange}
          onRemove={(id) => onToggle(id)}
        />
        <div className="insurance-banner" style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <img src="/images/order-management-decoration.png" alt="中国铁路保险" style={{ width: '100%', display: 'block' }} />
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoSection;
