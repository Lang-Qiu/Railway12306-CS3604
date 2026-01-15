import React, { useState } from 'react';
import SelectDropdown from '../SelectDropdown';
import { validators } from '../../utils/validators';
import './PassengerForm.css';

export interface PassengerFormData {
  name: string;
  idCardType: string;
  idCardNumber: string;
  phone: string;
  discountType: string;
}

interface PassengerFormProps {
  initialData?: Partial<PassengerFormData>;
  mode: 'add' | 'edit';
  onSubmit: (data: PassengerFormData) => Promise<void>;
  onCancel: () => void;
}

const PassengerForm: React.FC<PassengerFormProps> = ({
  initialData,
  mode,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<PassengerFormData>({
    name: '',
    idCardType: '居民身份证',
    idCardNumber: '',
    phone: '',
    discountType: '成人',
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const idCardTypes = [
    '居民身份证',
    '港澳居民来往内地通行证',
    '台湾居民来往大陆通行证',
    '护照'
  ];

  const discountTypes = ['成人', '儿童', '学生', '残军'];

  const validateName = (value: string) => {
    if (!value) return '请输入姓名！';
    if (!/^[\u4e00-\u9fa5a-zA-Z.\s]+$/.test(value)) return '请输入姓名！';
    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // 仅在新增模式下验证姓名和证件号
    if (mode === 'add') {
      const nameError = validateName(formData.name);
      if (nameError) newErrors.name = nameError;

      if (!formData.idCardNumber) {
        newErrors.idCardNumber = '证件号码不能为空';
      } else if (formData.idCardType === '居民身份证' && !validators.validateIdCard(formData.idCardNumber)) {
        newErrors.idCardNumber = '请正确输入18位证件号码！';
      }
    }

    if (!formData.phone) {
      newErrors.phone = '手机号码不能为空';
    } else if (!validators.validatePhone(formData.phone)) {
      newErrors.phone = '您输入的手机号码不是有效的格式！';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PassengerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isReadOnly = mode === 'edit';

  return (
    <div className="passenger-form-container">
      {/* 基本信息 */}
      <div className={`passenger-section ${isReadOnly ? 'edit-basic-info-section' : ''}`}>
        <h3 className="passenger-section-title">基本信息</h3>

        {isReadOnly ? (
          <div className="edit-info-content">
            <InfoRow label="证件类型" value={formData.idCardType} required />
            <InfoRow label="姓名" value={formData.name} required />
            <InfoRow label="证件号码" value={formData.idCardNumber} required />
            <InfoRow label="国家/地区" value="中国China" required />
            <InfoRow label="核验状态" value="已通过" valueClassName="edit-verification-status" />
          </div>
        ) : (
          <>
            <FormRow label="证件类型" required>
              <div className="passenger-input-wrapper">
                <SelectDropdown
                  options={idCardTypes}
                  value={formData.idCardType}
                  onChange={(val) => handleChange('idCardType', val)}
                  placeholder="请选择证件类型"
                />
              </div>
            </FormRow>

            <FormRow label="姓名" required error={errors.name}>
              <div className="passenger-input-wrapper">
                <input
                  type="text"
                  className={`passenger-input ${errors.name ? 'passenger-input-error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="请输入姓名"
                />
              </div>
              <span className="passenger-hint passenger-hint-block">姓名填写规则（用于身份核验）</span>
            </FormRow>

            <FormRow label="证件号码" required error={errors.idCardNumber}>
              <div className="passenger-input-wrapper">
                <input
                  type="text"
                  className={`passenger-input ${errors.idCardNumber ? 'passenger-input-error' : ''}`}
                  value={formData.idCardNumber}
                  onChange={(e) => handleChange('idCardNumber', e.target.value)}
                  placeholder="请填写证件号码"
                />
              </div>
              <span className="passenger-hint passenger-hint-block">用于身份核验，请正确填写。</span>
            </FormRow>
          </>
        )}
      </div>

      {/* 联系方式 */}
      <div className="passenger-section">
        <h3 className="passenger-section-title">
          联系方式<span className="passenger-section-subtitle">（请提供乘车人真实有效的联系方式）</span>
        </h3>

        <FormRow label="手机号码" error={errors.phone}>
          <div className="passenger-input-wrapper">
            <div className="passenger-phone-group">
              <SelectDropdown
                options={['+86']}
                value="+86"
                onChange={() => {}}
                placeholder="+86"
              />
              <input
                type="text"
                className={`passenger-input passenger-phone-input ${errors.phone ? 'passenger-input-error' : ''}`}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="请填写手机号码"
                maxLength={11}
              />
            </div>
          </div>
          <div className="passenger-hint passenger-hint-block">
            请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
          </div>
        </FormRow>
      </div>

      {/* 附加信息 */}
      <div className="passenger-section">
        <h3 className="passenger-section-title">附加信息</h3>

        <FormRow label="优惠(待)类型" required>
          <div className="passenger-input-wrapper">
            <SelectDropdown
              options={discountTypes}
              value={formData.discountType}
              onChange={(val) => handleChange('discountType', val)}
              placeholder="请选择优惠类型"
            />
          </div>
        </FormRow>
      </div>

      {/* 按钮组 */}
      <div className="passenger-button-group">
        <button className="passenger-button passenger-button-cancel" onClick={onCancel}>
          取消
        </button>
        <button 
          className="passenger-button passenger-button-submit" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

// 辅助组件：表单行
const FormRow: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({
  label, required, error, children
}) => (
  <div className="passenger-form-row">
    <div className="passenger-label-wrapper">
      <label className="passenger-label">
        {required && <span className="passenger-required">*</span>} {label}：
      </label>
    </div>
    <div className="passenger-input-container">
      {children}
      {error && <div className="passenger-error-message">{error}</div>}
    </div>
  </div>
);

// 辅助组件：只读信息行
const InfoRow: React.FC<{ label: string; value: string; required?: boolean; valueClassName?: string }> = ({
  label, value, required, valueClassName
}) => (
  <div className="edit-info-row">
    <span className="edit-info-label">
      {required && <span className="edit-required-mark">* </span>}{label}：
    </span>
    <span className={`edit-info-value ${valueClassName || ''}`}>{value}</span>
  </div>
);

export default PassengerForm;
