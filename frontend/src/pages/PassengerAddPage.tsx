import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/SideMenu';
import { addPassenger, Passenger } from '../api/passengers';
import './PassengerAddPage.css';

const PassengerAddPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Passenger>>({
    idCardType: '二代居民身份证',
    discountType: '成人',
    name: '',
    idCardNumber: '',
    phone: '',
    seatPreference: '无偏好', // Default value
    specialNeeds: '',
    isCommon: true
  });

  const handleSave = async () => {
    // Basic validation
    if (!formData.name) {
      alert('请输入姓名');
      return;
    }
    if (!formData.idCardNumber) {
      alert('请填写证件号码');
      return;
    }
    // Simple ID Card validation (18 digits)
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (formData.idCardType === '二代居民身份证' && !idCardRegex.test(formData.idCardNumber)) {
      alert('证件号码格式错误');
      return;
    }

    setLoading(true);
    try {
      // Hardcoded userId for now, similar to other pages
      const res = await addPassenger({ ...formData, userId: 1 });
      if (res) {
        alert('添加成功');
        navigate('/passengers');
      }
    } catch (error) {
      console.error('Failed to add passenger', error);
      alert('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="passenger-add-page">
      <div className="content-wrapper">
        <div className="breadcrumb">
          当前位置：个人中心 &gt; 常用信息管理 &gt; <span>乘车人</span>
        </div>
        
        <div className="main-content">
          <SideMenu activeMenu="passengers" />
          
          <div className="right-panel">
            <div className="warning-bar">
              <span className="warning-icon">!</span>
              如旅客身份信息未能添加后的24小时内通过核验，请乘车人持有效身份证原件到车站办理身份核验。
            </div>

            <div className="add-form-container">
              {/* Basic Info */}
              <div className="form-section">
                <div className="section-title">基本信息</div>
                
                <div className="form-row">
                  <div className="form-label"><span className="required">*</span>证件类型：</div>
                  <div className="form-input-wrapper">
                    <select 
                      className="form-select"
                      value={formData.idCardType}
                      onChange={e => setFormData({...formData, idCardType: e.target.value})}
                    >
                      <option value="二代居民身份证">二代居民身份证</option>
                      <option value="护照">护照</option>
                      <option value="港澳居民来往内地通行证">港澳居民来往内地通行证</option>
                      <option value="台湾居民来往大陆通行证">台湾居民来往大陆通行证</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><span className="required">*</span>姓名：</div>
                  <div className="form-input-wrapper">
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="请输入姓名"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <span className="input-tip-right">姓名填写规则（用于身份核验）</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><span className="required">*</span>证件号码：</div>
                  <div className="form-input-wrapper">
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="请填写证件号码"
                      value={formData.idCardNumber}
                      onChange={e => setFormData({...formData, idCardNumber: e.target.value})}
                    />
                    <span className="input-tip-right">用于身份核验，请正确填写。</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="form-section">
                <div className="section-title">
                  联系方式
                  <span className="tip">(请提供乘车人真实有效的联系方式)</span>
                </div>

                <div className="form-row">
                  <div className="form-label">手机号码：</div>
                  <div className="form-input-wrapper">
                    <div className="phone-group">
                      <select className="phone-prefix" disabled>
                        <option>+86</option>
                      </select>
                      <input 
                        type="text" 
                        className="phone-input"
                        placeholder="请填写手机号码"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="input-tip-bottom">
                  请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
                </div>
              </div>

              {/* Additional Info */}
              <div className="form-section">
                <div className="section-title">附加信息</div>
                
                <div className="form-row">
                  <div className="form-label"><span className="required">*</span>优惠(待)类型：</div>
                  <div className="form-input-wrapper">
                    <select 
                      className="form-select"
                      value={formData.discountType}
                      onChange={e => setFormData({...formData, discountType: e.target.value})}
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
                <button className="btn-cancel" onClick={() => navigate('/passengers')}>取消</button>
                <button className="btn-save" onClick={handleSave} disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerAddPage;
