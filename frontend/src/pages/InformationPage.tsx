import React, { useEffect, useState } from 'react';
import SideMenu from '../components/SideMenu';
import PersonalInfoPanel from '../components/PersonalInfoPanel';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { getUserProfile, UserProfile } from '../api/user';

const InformationPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setUser(data);
    } catch (err) {
      setError('获取用户信息失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const breadcrumbItems = [
    { label: '个人中心', path: '/personal-center' }, // Assuming this route exists or is a placeholder
    { label: '查看个人信息' }
  ];

  return (
    <div style={{ backgroundColor: '#f5f5f5', flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flex: 1 }}>
        <BreadcrumbNavigation items={breadcrumbItems} />
        
        <div style={{ 
          width: '1200px', 
          margin: '0 auto', 
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <SideMenu />
          
          {loading ? (
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff', textAlign: 'center' }}>
              加载中...
            </div>
          ) : error ? (
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff', textAlign: 'center', color: 'red' }}>
              {error}
            </div>
          ) : user ? (
            <PersonalInfoPanel user={user} onUserUpdate={fetchUser} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InformationPage;
