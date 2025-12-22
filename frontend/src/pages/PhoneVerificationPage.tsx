import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/SideMenu';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { validatePassword, sendChangePhoneCode, updateUserPhone } from '../api/user';
import './PhoneVerificationPage.css';

const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('请输入登录密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const isValid = await validatePassword(password);
      if (isValid) {
        setStep(2);
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!newPhone) {
      setError('请输入新手机号');
      return;
    }
    // Simple phone regex
    if (!/^1[3-9]\d{9}$/.test(newPhone)) {
      setError('手机号格式不正确');
      return;
    }
    
    try {
      await sendChangePhoneCode(newPhone);
      setCountdown(60);
      setError('');
    } catch (err) {
      setError('发送验证码失败');
    }
  };

  const handlePhoneSubmit = async () => {
    if (!newPhone || !code) {
      setError('请填写完整信息');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateUserPhone(newPhone, code, password);
      setStep(3);
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: '个人中心', path: '/personal-center' }, // Assuming this route exists or just placeholder
    { label: '手机核验' }
  ];

  return (
    <div style={{ backgroundColor: '#f5f5f5', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <BreadcrumbNavigation items={breadcrumbItems} />
        <div style={{ width: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
          <SideMenu />
          
          <div className="phone-verification-container">
            {step === 1 && (
              <div className="verification-step">
                <div className="step-header">步骤 1：验证身份</div>
                <div className="form-group">
                  <label className="form-label">登录密码：</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入登录密码"
                  />
                </div>
                {error && <div style={{ color: 'red', marginLeft: '135px', marginBottom: '10px' }}>{error}</div>}
                <div className="form-group">
                  <div style={{ width: '135px' }}></div>
                  <button className="btn-primary" onClick={handlePasswordSubmit} disabled={loading}>
                    {loading ? '验证中...' : '下一步'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="verification-step">
                <div className="step-header">步骤 2：绑定新手机</div>
                <div className="form-group">
                  <label className="form-label">新手机号：</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newPhone} 
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="请输入新手机号"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">验证码：</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ width: '180px' }}
                    value={code} 
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                  />
                  <button 
                    className="code-btn" 
                    onClick={handleSendCode} 
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </button>
                </div>
                {error && <div style={{ color: 'red', marginLeft: '135px', marginBottom: '10px' }}>{error}</div>}
                <div className="form-group">
                  <div style={{ width: '135px' }}></div>
                  <button className="btn-primary" onClick={handlePhoneSubmit} disabled={loading}>
                    {loading ? '提交中...' : '完成'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h3>手机号修改成功</h3>
                <p>新手机号：{newPhone}</p>
                <div style={{ marginTop: '20px' }}>
                  <button className="btn-primary" onClick={() => navigate('/information')}>
                    返回个人信息
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;
