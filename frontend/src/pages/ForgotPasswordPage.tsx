import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendResetPasswordCode, verifyResetPasswordCode, resetPassword } from '../api/password'
import { getPublicKey } from '../api/auth'
import * as forge from 'node-forge'
import './ForgotPasswordPage.css'

type TabType = 'face' | 'phone' | 'email'
type StepType = 1 | 2 | 3 | 4

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('phone')
  const [step, setStep] = useState<StepType>(1)
  
  // 表单数据
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [idType, setIdType] = useState('居民身份证')
  const [idNumber, setIdNumber] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [publicKey, setPublicKey] = useState('')

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await getPublicKey()
        if (response.success) {
          setPublicKey(response.publicKey)
        }
      } catch (error) {
        console.error('Failed to fetch public key', error)
      }
    }
    fetchPublicKey()
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setStep(1)
    setError('')
    setSuccess('')
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (activeTab === 'face') {
      setError('人脸找回功能暂未开放')
      return
    }

    const identifier = activeTab === 'phone' ? phone : email

    if (!identifier) {
      setError(activeTab === 'phone' ? '请输入手机号' : '请输入邮箱')
      return
    }

    if (!idNumber) {
      setError('请输入证件号码')
      return
    }

    setIsLoading(true)

    try {
      const response = await sendResetPasswordCode(identifier, idNumber)
      if (response.success) {
        setSessionId(response.sessionId)
        setSuccess('验证码已发送')
        setStep(2)
        // 开发环境显示验证码
        if (response.verificationCode) {
          console.log('验证码:', response.verificationCode)
        }
      }
    } catch (error: any) {
      console.error('Send code error:', error)
      setError(error.response?.data?.error || '发送验证码失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setIsLoading(true)

    try {
      const response = await verifyResetPasswordCode(sessionId, verificationCode)
      if (response.success) {
        setSuccess('验证成功')
        setStep(3)
      }
    } catch (error: any) {
      console.error('Verify code error:', error)
      setError(error.response?.data?.error || '验证码错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newPassword || newPassword.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (!publicKey) {
      setError('无法获取加密密钥，请刷新页面重试')
      return
    }

    setIsLoading(true)

    try {
      const publicKeyFromPem = forge.pki.publicKeyFromPem(publicKey)
      const encryptedPassword = forge.util.encode64(publicKeyFromPem.encrypt(newPassword, 'RSA-OAEP'))

      const response = await resetPassword(sessionId, encryptedPassword)
      if (response.success) {
        setSuccess('密码重置成功！')
        setStep(4)
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      setError(error.response?.data?.error || '重置密码失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = (stepNum: StepType) => {
    switch (stepNum) {
      case 1: return '填写账户信息'
      case 2: return '获取验证码'
      case 3: return '设置新密码'
      case 4: return '完成'
      default: return ''
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Tab 选项卡 */}
        <div className="tabs-container">
          <div 
            className={`tab ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => handleTabChange('face')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-text">人脸找回</span>
          </div>
          <div 
            className={`tab ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => handleTabChange('phone')}
          >
            <span className="tab-icon">📱</span>
            <span className="tab-text">手机找回</span>
          </div>
          <div 
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => handleTabChange('email')}
          >
            <span className="tab-icon">📧</span>
            <span className="tab-text">邮箱找回</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="progress-container">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="progress-step-wrapper">
                <div className={`progress-step ${step >= stepNum ? 'active' : ''} ${step > stepNum ? 'completed' : ''}`}>
                  <div className="step-circle">{step > stepNum ? '✓' : stepNum}</div>
                </div>
                <div className="step-label">{getStepTitle(stepNum as StepType)}</div>
                {stepNum < 4 && <div className={`step-line ${step > stepNum ? 'completed' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* 表单内容区域 */}
        <div className="form-content">
          {activeTab === 'face' && (
            <div className="placeholder-content">
              <div className="placeholder-icon">🚧</div>
              <p className="placeholder-text">人脸识别找回功能正在开发中</p>
              <p className="placeholder-hint">请使用手机找回或邮箱找回</p>
            </div>
          )}

          {activeTab === 'phone' && step === 1 && (
            <form onSubmit={handleStep1Submit} className="forgot-password-form">
              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 手机号码：</label>
                <div className="form-input-wrapper">
                  <select className="country-code">
                    <option>+86</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="已通过核验的手机号码"
                    disabled={isLoading}
                  />
                  {!phone && <span className="input-hint error-hint">请输入手机号码</span>}
                </div>
              </div>

              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 证件类型：</label>
                <div className="form-input-wrapper">
                  <select 
                    className="form-select"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <option>居民身份证</option>
                    <option>港澳居民来往内地通行证</option>
                    <option>台湾居民来往大陆通行证</option>
                    <option>护照</option>
                  </select>
                  <span className="input-hint">请选择证件类型</span>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 证件号码：</label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="请输入证件号码"
                    disabled={isLoading}
                  />
                  {!idNumber && <span className="input-hint error-hint">请输入证件号码</span>}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? '提交中...' : '提交'}
                </button>
              </div>

              <div className="form-footer">
                <span>手机号未通过核验？</span>
                <a href="#" className="link">试试邮箱找回</a>
              </div>
            </form>
          )}

          {activeTab === 'email' && step === 1 && (
            <form onSubmit={handleStep1Submit} className="forgot-password-form">
              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 邮箱地址：</label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="已通过核验的邮箱地址"
                    disabled={isLoading}
                  />
                  {!email && <span className="input-hint error-hint">请输入邮箱地址</span>}
                </div>
              </div>

              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 证件类型：</label>
                <div className="form-input-wrapper">
                  <select 
                    className="form-select"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <option>居民身份证</option>
                    <option>港澳居民来往内地通行证</option>
                    <option>台湾居民来往大陆通行证</option>
                    <option>护照</option>
                  </select>
                  <span className="input-hint">请选择证件类型</span>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 证件号码：</label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="请输入证件号码"
                    disabled={isLoading}
                  />
                  {!idNumber && <span className="input-hint error-hint">请输入证件号码</span>}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? '提交中...' : '提交'}
                </button>
              </div>

              <div className="form-footer">
                <span>邮箱未通过核验？</span>
                <a href="#" className="link">试试手机找回</a>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="forgot-password-form">
              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 验证码：</label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    className="form-input verification-code-input"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <span className="input-hint">
                    验证码已发送到 {activeTab === 'phone' ? phone : email}
                  </span>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? '验证中...' : '下一步'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="forgot-password-form">
              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 新密码：</label>
                <div className="form-input-wrapper">
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="form-label"><span className="required">*</span> 确认密码：</label>
                <div className="form-input-wrapper">
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="success-content">
              <div className="success-icon">✓</div>
              <h3 className="success-title">密码重置成功！</h3>
              <p className="success-text">您的密码已成功重置</p>
              <p className="success-hint">3秒后将自动跳转到登录页面...</p>
              <button 
                className="goto-login-button" 
                onClick={() => navigate('/login')}
              >
                立即登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
