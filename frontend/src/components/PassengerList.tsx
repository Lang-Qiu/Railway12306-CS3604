import React from 'react';

export interface Passenger {
  id: number;
  name: string;
  phone?: string;
  id_card_number?: string;
  discount_type?: string;
}

interface PassengerListProps {
  passengers: Passenger[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

// Simple Custom Checkbox to match visual requirements
const Checkbox: React.FC<{ checked?: boolean; onChange?: () => void; label: string }> = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px 15px 5px 25px', marginRight: '8px' }}>
    <div style={{
      width: '14px',
      height: '14px',
      border: checked ? '1px solid #5aabf5' : '1px solid #999999',
      backgroundColor: checked ? '#5aabf5' : 'white',
      marginRight: '5px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {checked && '✓'}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    <span style={{ fontSize: '14px', color: '#333333' }}>{label}</span>
  </label>
);

const PassengerList: React.FC<PassengerListProps> = ({ passengers, selectedIds, onToggle }) => {
  return (
    <div className="passenger-list-container" style={{ marginBottom: '5px', borderBottom: '1px dashed #bbbbbb' }}>
      <div className="subtitle" style={{ fontSize: '14px', fontWeight: 600, color: '#0066cc', display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '18px', marginRight: '5px' }}>👤</span> 乘车人
      </div>
      <div className="passenger-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px 0' }}>
        {passengers.map(p => (
          <Checkbox 
            key={p.id} 
            label={p.name} 
            checked={selectedIds.includes(p.id)}
            onChange={() => onToggle(p.id)}
          />
        ))}
        {passengers.length === 0 && <span style={{color: '#999', fontSize: '14px'}}>暂无乘车人，请添加</span>}
      </div>
    </div>
  );
};

export default PassengerList;
