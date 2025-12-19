import React from 'react';

const PassengerSearch: React.FC = () => {
  return (
    <div className="passenger-search-box" style={{ display: 'flex', alignItems: 'center' }}>
      <input 
        type="text" 
        placeholder="搜索" 
        style={{ 
          width: '150px', 
          height: '32px', 
          padding: '6px 12px', 
          border: '1px solid #666666', 
          borderRadius: '0',
          fontSize: '13px',
          color: '#333',
          outline: 'none'
        }} 
      />
      <button style={{ 
        width: '32px', 
        height: '32px', 
        background: '#589bdf', 
        border: 'none', 
        color: 'white', 
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '16px'
      }}>
        🔍
      </button>
    </div>
  );
};

export default PassengerSearch;
