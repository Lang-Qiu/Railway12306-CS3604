import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '../constants/routes'
import { login as apiLogin, verifyLogin as apiVerifyLogin, getPublicKey as apiGetPublicKey, getCsrfToken as apiGetCsrfToken } from '../api/auth'
import LoginForm from '../components/LoginForm'
import SmsVerificationModal from '../components/SmsVerificationModal'
import * as forge from 'node-forge';

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [smsSuccess, setSmsSuccess] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await apiGetPublicKey();
        if (response.success) {
          setPublicKey(response.publicKey);
        }
      } catch (error) {
        console.error('Failed to fetch public key', error);
      }
    };

    const fetchCsrf = async () => {
      try {
        const res = await apiGetCsrfToken();
        if (res.success) {
          setCsrfToken(res.token);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token', error);
      }
    };

    fetchPublicKey();
    fetchCsrf();
  }, []);

  const handleLoginSuccess = async (data: { identifier?: string; username?: string; password: string }) => {
    setIsLoading(true)
    setError('')
    
    try {
      if (!publicKey) {
        setError('无法获取加密密钥，请刷新页面重试');
        return;
      }

      const publicKeyFromPem = forge.pki.publicKeyFromPem(publicKey);
      const encryptedPassword = forge.util.encode64(publicKeyFromPem.encrypt(data.password, 'RSA-OAEP'));

      // 调用登录API（支持identifier或username）
      const response = await apiLogin({ identifier: data.identifier, username: data.username, password: encryptedPassword }, csrfToken)
      if (response.success) {
        setSessionId(response.sessionId)
        setShowSmsModal(true)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.response?.data?.error || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigateToRegister = () => {
    navigate(PATHS.register)
  }

  const handleNavigateToForgotPassword = () => {
    navigate('/forgot-password')
  }

  // const handleSmsVerificationSuccess = () => {
  //   // TODO: 实现短信验证成功后的逻辑
  //   console.log('SMS verification success')
  //   setShowSmsModal(false)
  // }

  const handleCloseSmsModal = () => {
    setShowSmsModal(false)
    setSmsError('')
    setSmsSuccess('')
  }

  const handleSmsVerificationSubmit = async (data: { idCardLast4: string; code: string }) => {
    // 清除之前的消息
    setSmsError('')
    setSmsSuccess('')
    
    try {
      // 调用验证登录API
      const response = await apiVerifyLogin({ sessionId, idCardLast4: data.idCardLast4, verificationCode: data.code })
      
      if (response.success) {
        console.log('SMS verification success:', response)
        // 持久化登录态（供全站读取）
        if (response.token) localStorage.setItem('authToken', response.token)
        if (response.user?.username) localStorage.setItem('username', response.user.username)
        if (response.user?.id) localStorage.setItem('userId', String(response.user.id))
        // 通知其它组件登录状态已更新（同 Tab 场景下不会触发 storage 事件）
        window.dispatchEvent(new Event('auth-updated'))
        setSmsSuccess('登录成功！')
        // 立即关闭弹窗并跳转首页
        setShowSmsModal(false)
        navigate('/')
      }
    } catch (error: any) {
      console.error('SMS verification error:', error)
      console.log('错误响应数据:', error.response?.data)
      console.log('错误状态码:', error.response?.status)
      const errorMsg = error.response?.data?.error || '验证失败，请重试'
      console.log('最终显示的错误信息:', errorMsg)
      // 直接显示后端返回的错误信息
      setSmsError(errorMsg)
    }
  }

  return (
    <div className="login-page">
      <div data-testid="top-navigation" onClick={() => console.log('Logo clicked')} />
      
      <div className="login-content">
        <div className="login-promotion">
          
        </div>
        
        <div className="login-form-container">
          <LoginForm
            onSubmit={handleLoginSuccess}
            onQrLogin={() => console.log('QR login')}
            onRegisterClick={handleNavigateToRegister}
            onForgotPasswordClick={handleNavigateToForgotPassword}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      
      {showSmsModal && sessionId && (
        <SmsVerificationModal
          sessionId={sessionId}
          onClose={handleCloseSmsModal}
          onSubmit={handleSmsVerificationSubmit}
          externalError={smsError}
          externalSuccess={smsSuccess}
        />
      )}
      <div data-testid="bottom-navigation" />
    </div>
  )
}

export default LoginPage
