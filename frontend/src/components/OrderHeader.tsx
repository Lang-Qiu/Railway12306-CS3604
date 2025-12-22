import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
      <div 
        className="logo-area" 
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <img 
            src="/images/login-page-top-nav-logo-area.png" 
            alt="中国铁路12306" 
            style={{ height: '48px' }} 
        />
      </div>
      <div className="welcome-message" style={{ fontSize: '14px', color: '#000' }}>
        欢迎登录12306
      </div>
    </div>
  );
};

export default OrderHeader;
