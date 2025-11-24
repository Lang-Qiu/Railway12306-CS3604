import React, { useState, useEffect } from 'react'
import './SmsVerificationModal.css'
import { sendVerificationCode as apiSendVerificationCode } from '../api/auth'

interface SmsVerificationModalProps {
  sessionId?: string
  onClose: () => void
  onSubmit: (data: { idCardLast4: string; code: string }) => void
  externalError?: string
  externalSuccess?: string
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({
  sessionId,
  onClose,
  onSubmit,
  externalError = '',
  externalSuccess = ''
}) => {
  const [idCardLast4, setIdCardLast4] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!idCardLast4 || idCardLast4.length !== 4) {
      setValidationError('请填写证件号后4位')
      return
    }
    setIsLoading(true)
    setValidationError('')
    console.log('Sending SMS for ID card last 4:', idCardLast4)
    if (!sessionId) {
      setCountdown(60)
      setIsLoading(false)
      return
    }
    try {
      const response = await apiSendVerificationCode({ sessionId, idCardLast4 })
      const ok = (response as any)?.success ?? (response as any)?.data?.success
      if (ok) {
        const realCode = (response as any)?.verificationCode ?? (response as any)?.data?.verificationCode
        const phone = (response as any)?.phone ?? (response as any)?.data?.phone
        if (realCode) {
          console.log(`\n=================================`)
          console.log(`📱 登录验证码`)
          console.log(`手机号: ${phone || '未知'}`)
          console.log(`验证码: ${realCode}`)
          console.log(`有效期: 5分钟`)
          console.log(`=================================\n`)
        }
        setCountdown(60)
      } else {
        setValidationError('验证码发送失败')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '验证码发送失败，请稍后重试'
      setValidationError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 清除之前的错误
    setValidationError('')
    
    // 客户端验证
    if (!idCardLast4 || idCardLast4.trim() === '') {
      setValidationError('请填写证件号后4位')
      return
    }
    
    if (idCardLast4.length !== 4) {
      setValidationError('请填写证件号后4位')
      return
    }
    
    if (!code || code.trim() === '') {
      setValidationError('请填写验证码')
      return
    }
    
    if (code.length < 6) {
      setValidationError('验证码格式不正确')
      return
    }
    
    onSubmit({ idCardLast4, code })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // 判断发送按钮是否可用
  const isSendButtonDisabled = idCardLast4.length < 4 || countdown > 0 || isLoading

  return (
    <div className="sms-modal-backdrop" onClick={handleBackdropClick}>
      <div className="sms-modal">
        <div className="sms-modal-header">
          <span className="modal-title">选择验证方式</span>
          <button className="close-button" onClick={onClose} type="button">
            ×
          </button>
        </div>
        
        <div className="verification-type">
          短信验证
        </div>
        
        <form className="sms-modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="请输入登录账号绑定的证件号后4位"
              value={idCardLast4}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/[^0-9xX]/g, '')
                  .toUpperCase()
                  .slice(0, 4)
                setIdCardLast4(value)
                setValidationError('')
              }}
              maxLength={4}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <div className="code-input-group">
              <input
                type="text"
                placeholder="输入验证码"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                  setValidationError('')
                }}
                maxLength={6}
                className="form-input code-input"
              />
              <button
                type="button"
                className={`send-code-button ${isSendButtonDisabled ? 'disabled' : ''}`}
                onClick={handleSendCode}
                disabled={isSendButtonDisabled}
              >
                {countdown > 0 
                  ? `重新发送(${countdown}s)` 
                  : isLoading 
                  ? '发送中...' 
                  : '获取验证码'}
              </button>
            </div>
          </div>
          
          {(validationError || externalError) && (
            <div className="error-message">{externalError || validationError}</div>
          )}
          
          {externalSuccess && (
            <div className="success-message">{externalSuccess}</div>
          )}
          
          <button type="submit" className="confirm-button">
            确定
          </button>
        </form>
      </div>
    </div>
  )
}

export default SmsVerificationModal
