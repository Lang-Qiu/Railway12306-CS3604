import React from 'react';
import SelectDropdown from './SelectDropdown';
import { Passenger } from './PassengerList';

interface SeatOption {
  label: string;
  value: string;
}

interface PurchaseInfoTableProps {
  selectedPassengers: Passenger[];
  seatOptions: SeatOption[];
  seatSelections: { [key: number]: string };
  onSeatChange: (id: number, seatType: string) => void;
  onRemove: (id: number) => void;
}

const PurchaseInfoTable: React.FC<PurchaseInfoTableProps> = ({ 
  selectedPassengers, 
  seatOptions, 
  seatSelections, 
  onSeatChange, 
  onRemove 
}) => {
  return (
    <div className="purchase-info-table" style={{ marginTop: '10px', marginBottom: '15px', border: '1px solid #b9b9b9', background: 'white' }}>
      {/* Header */}
      <div className="table-header" style={{ 
        display: 'grid', 
        gridTemplateColumns: '40px 110px 200px 140px 160px 1fr 40px',
        gap: '8px', 
        padding: '6px 12px', 
        background: '#fdfdfd', 
        borderBottom: '1px solid #dddddd',
        fontSize: '14px',
        fontWeight: 400,
        color: '#000000'
      }}>
        <div style={{ textAlign: 'center' }}>序号</div>
        <div>票种</div>
        <div>席别</div>
        <div>姓名</div>
        <div>证件类型</div>
        <div>证件号码</div>
        <div></div>
      </div>

      {/* Body */}
      <div className="table-body">
        {selectedPassengers.length === 0 ? (
           <div className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
             请选择乘车人
           </div>
        ) : (
          selectedPassengers.map((row, index) => (
            <div key={row.id} className="table-row" style={{
              display: 'grid', 
              gridTemplateColumns: '40px 110px 200px 140px 160px 1fr 40px',
              gap: '8px', 
              padding: '12px',
              minHeight: '45px',
              backgroundColor: index % 2 === 0 ? '#eef1fa' : '#f0f7ff', 
              borderBottom: '1px solid #e0e0e0',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 400, color: '#000000' }}>{index + 1}</div>
              <div>
                <SelectDropdown 
                  options={[{ label: '成人票', value: '成人票' }]} 
                  value="成人票" 
                  onChange={() => {}} 
                />
              </div>
              <div>
                <SelectDropdown 
                  options={seatOptions} 
                  value={seatSelections[row.id] || (seatOptions[0]?.value || '')} 
                  onChange={(val) => onSeatChange(row.id, val)} 
                />
              </div>
              <div>
                <input type="text" value={row.name} readOnly style={{
                  width: '100%', padding: '6px 10px', border: '1px solid #cccccc', borderRadius: '2px',
                  fontSize: '14px', color: '#333333', background: 'white'
                }} />
              </div>
              <div>
                <SelectDropdown 
                  options={[{ label: '居民身份证', value: '居民身份证' }]} 
                  value="居民身份证" 
                  onChange={() => {}} 
                  disabled
                />
              </div>
              <div>
                 <input type="text" value={row.id_card_number || ''} readOnly style={{
                  width: '100%', padding: '6px 10px', border: '1px solid #cccccc', borderRadius: '2px',
                  fontSize: '14px', color: '#333333', background: 'white'
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => onRemove(row.id)}
                  style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: '#ff6600',
                    color: 'white', border: 'none', fontSize: '14px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
                  }}>×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PurchaseInfoTable;
