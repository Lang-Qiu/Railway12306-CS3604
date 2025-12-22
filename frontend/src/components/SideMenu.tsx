import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SideMenu.css';

const SideMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      title: '订单中心',
      items: [
        { name: '火车票订单', path: '/order/list' }
      ]
    },
    {
      title: '个人信息',
      items: [
        { name: '查看个人信息', path: '/information' },
        { name: '手机核验', path: '/phone-verification' }
      ]
    },
    {
      title: '常用信息管理',
      items: [
        { name: '乘车人', path: '/passengers' }
      ]
    }
  ];

  return (
    <div className="side-menu">
      <div className="menu-header">个人中心</div>
      {menuItems.map((section, index) => (
        <div key={index} className="menu-section">
          <div className="menu-section-title">{section.title}</div>
          {section.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SideMenu;
