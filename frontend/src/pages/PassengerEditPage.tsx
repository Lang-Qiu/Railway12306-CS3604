import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Passenger, updatePassenger } from '../api/passengers';
import './PassengerEditPage.css';

const PassengerEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passenger = location.state?.passenger as Passenger;

  // Form state
  const [formData, setFormData] = useState<Partial<Passenger>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!passenger) {
      alert('未找到乘车人信息');
      navigate('/passengers');
      return;
    }
    setFormData({
      ...passenger,
      // Ensure specific fields are set defaults if missing
      phone: passenger.phone || '',
      discountType: passenger.discountType || '成人'
    });
  }, [passenger, navigate]);

  const handleSave = async () => {
    if (!passenger || !formData) return;
    
    setLoading(true);
    try {
      const res = await updatePassenger(passenger.id, {
        ...formData,
        userId: passenger.userId,
        version: passenger.version // Ensure version control
      });
      
      if (res.success || res.passenger) { // Adjust based on actual API response structure
        alert('保存成功');
        navigate('/passengers');
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Save failed', error);
      alert('保存失败：网络或服务器错误');
    } finally {
      setLoading(false);
    }
  };

  if (!passenger) return null;

  return (
    <div className="passenger-edit-page">
      <div className="passenger-edit-container">
        {/* Basic Info Section */}
        <div className="edit-section">
          <div className="section-header">基本信息</div>
          
          <div className="form-row">
            <div className="form-label"><span className="required">*</span>证件类型：</div>
            <div className="form-value">{passenger.idCardType || '居民身份证'}</div>
          </div>

          <div className="form-row">
            <div className="form-label"><span className="required">*</span>姓名：</div>
            <div className="form-value">{passenger.name}</div>
          </div>

          <div className="form-row">
            <div className="form-label"><span className="required">*</span>证件号码：</div>
            <div className="form-value">{passenger.idCardNumber}</div>
          </div>

          <div className="form-row">
            <div className="form-label"><span className="required">*</span>国家/地区：</div>
            <div className="form-value">中国China</div>
          </div>

          <div className="form-row">
            <div className="form-label">添加日期：</div>
            <div className="form-value">
              {passenger.createdAt ? new Date(passenger.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="form-row">
            <div className="form-label">核验状态：</div>
            <div className="form-value highlight">{passenger.verificationStatus || '已通过'}</div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="edit-section">
          <div className="section-header">
            联系方式
            <span className="tip">(请提供乘车人真实有效的联系方式)</span>
          </div>

          <div className="form-row">
            <div className="form-label">手机号码：</div>
            <div className="form-input-group">
              <select className="country-code-select" disabled>
                <option>+86</option>
              </select>
              <input 
                type="text" 
                className="phone-input"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="input-tip">
            请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="edit-section">
          <div className="section-header">附加信息</div>
          
          <div className="form-row">
            <div className="form-label"><span className="required">*</span>优惠(待)类型：</div>
            <div className="form-input-group">
              <select 
                className="select-input"
                value={formData.discountType}
                onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
              >
                <option value="成人">成人</option>
                <option value="儿童">儿童</option>
                <option value="学生">学生</option>
                <option value="残疾军人">残疾军人</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button className="btn-cancel" onClick={() => navigate(-1)}>取消</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerEditPage;
