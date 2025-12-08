import React, { useState } from 'react';
import { UserProfile, updateUserEmail, updateUserDiscountType } from '../api/user';
import { useNavigate } from 'react-router-dom';
import './PersonalInfoPanel.css';

interface PersonalInfoPanelProps {
  user: UserProfile;
  onUserUpdate: () => void; // Callback to refresh user data
}

const PersonalInfoPanel: React.FC<PersonalInfoPanelProps> = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const [isContactEditing, setIsContactEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);

  const [isDiscountEditing, setIsDiscountEditing] = useState(false);
  const [editedDiscountType, setEditedDiscountType] = useState(user.discountType);
  const [isDiscountSaving, setIsDiscountSaving] = useState(false);

  const handleContactEdit = () => {
    setEditedEmail(user.email);
    setIsContactEditing(true);
  };

  const handleContactSave = async () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      alert('请输入有效的电子邮件地址！');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserEmail(editedEmail);
      setIsContactEditing(false);
      onUserUpdate(); // Refresh parent data
    } catch (error) {
      console.error('Failed to update email', error);
      alert('更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactCancel = () => {
    setIsContactEditing(false);
    setEditedEmail(user.email);
  };

  const handleDiscountEdit = () => {
    setEditedDiscountType(user.discountType);
    setIsDiscountEditing(true);
  };

  const handleDiscountSave = async () => {
    setIsDiscountSaving(true);
    try {
      await updateUserDiscountType(editedDiscountType);
      setIsDiscountEditing(false);
      onUserUpdate();
    } catch (error) {
      console.error('Failed to update discount type', error);
      alert('更新失败，请重试');
    } finally {
      setIsDiscountSaving(false);
    }
  };

  const handleDiscountCancel = () => {
    setIsDiscountEditing(false);
    setEditedDiscountType(user.discountType);
  };

  return (
    <div className="personal-info-panel">
      {/* Basic Info Section */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-title">基本信息</span>
        </div>
        <div className="info-row">
          <span className="info-label">用户名：</span>
          <span className="info-value">{user.username}</span>
        </div>
        <div className="info-row">
          <span className="info-label">姓名：</span>
          <span className="info-value">{user.name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">证件类型：</span>
          <span className="info-value">
            {user.idType === '1' ? '中国居民身份证' : '其他'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">证件号码：</span>
          <span className="info-value">{user.idNumber}</span>
        </div>
        <div className="info-row">
          <span className="info-label">核验状态：</span>
          <span className="info-value verification-status">{user.verificationStatus}</span>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-title">联系方式</span>
          {!isContactEditing ? (
            <button className="edit-btn" onClick={handleContactEdit}>编辑</button>
          ) : (
            <div>
              <button className="save-btn" onClick={handleContactSave} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button className="cancel-btn" onClick={handleContactCancel}>取消</button>
            </div>
          )}
        </div>
        <div className="info-row">
          <span className="info-label">手机号：</span>
          <span className="info-value">
            {user.phone}
            {isContactEditing ? (
              <span className="verify-link" onClick={() => navigate('/phone-verification')}>
                去手机核验修改
              </span>
            ) : (
              <span className="verification-status">已通过核验</span>
            )}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">邮箱：</span>
          {isContactEditing ? (
            <input
              type="email"
              className="email-input"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          ) : (
            <span className="info-value">{user.email || '未绑定'}</span>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-title">附加信息</span>
          {!isDiscountEditing ? (
            <button className="edit-btn" onClick={handleDiscountEdit}>编辑</button>
          ) : (
            <div>
              <button className="save-btn" onClick={handleDiscountSave} disabled={isDiscountSaving}>
                {isDiscountSaving ? '保存中...' : '保存'}
              </button>
              <button className="cancel-btn" onClick={handleDiscountCancel}>取消</button>
            </div>
          )}
        </div>
        <div className="info-row">
          <span className="info-label">优惠(待)类型：</span>
          {isDiscountEditing ? (
            <select
              className="discount-select"
              value={editedDiscountType}
              onChange={(e) => setEditedDiscountType(e.target.value)}
            >
              <option value="成人">成人</option>
              <option value="学生">学生</option>
              <option value="儿童">儿童</option>
              <option value="残疾军人">残疾军人</option>
            </select>
          ) : (
            <span className="info-value">{user.discountType}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoPanel;
