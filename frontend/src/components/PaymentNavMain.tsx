import React from 'react';
import { Link } from 'react-router-dom';

const PaymentNavMain: React.FC = () => {
  return (
    <div className="payment-nav-main" style={{ 
      backgroundColor: '#3B99FC', 
      borderBottom: '1px solid #2a88eb',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.12)',
      height: '45px',
      maxWidth: '1400px',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '0 auto',
      width: '100%'
    }}>
      <div className="nav-items" style={{ display: 'flex', flex: 1 }}>
        {['车票查询', '订单查询', '我的12306'].map((item, index) => (
          <Link 
            key={index} 
            to="#" 
            style={{ 
              flex: 1, 
              padding: '0 24px', 
              fontSize: '16px', 
              color: 'white', 
              textDecoration: 'none',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '45px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2676E3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {item}
          </Link>
        ))}
      </div>
      
      <div className="auth-buttons">
        <Link to="/login" style={{
          padding: '6px 18px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'background-color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        >
          登录 / 注册
        </Link>
      </div>
    </div>
  );
};

export default PaymentNavMain;
