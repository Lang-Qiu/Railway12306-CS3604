import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PATHS } from '../constants/routes'
import { login as apiLogin, verifyLogin as apiVerifyLogin, getPublicKey as apiGetPublicKey, getCsrfToken as apiGetCsrfToken } from '../api/auth'
import LoginForm from '../components/LoginForm'
import SmsVerificationModal from '../components/SmsVerificationModal'
import * as forge from 'node-forge';

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showSmsModal, setShowSmsModal] = useState(false)
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [smsSuccess, setSmsSuccess] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    const initConnection = async () => {
      // 1. Connection Test & Public Key
      let keyFetched = false;
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`[LoginFlow] Attempting to fetch public key (${i + 1}/3)...`);
          const response = await apiGetPublicKey();
          if (response.success) {
            setPublicKey(response.publicKey);
            console.log('[LoginFlow] Public key fetched successfully.');
            keyFetched = true;
            break;
          }
        } catch (error) {
          console.error(`[LoginFlow] Failed to fetch public key (attempt ${i + 1}/3):`, error);
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      if (!keyFetched) {
        setError('无法连接到服务器，请检查网络连接。');
        return;
      }

      // 2. CSRF Token
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`[LoginFlow] Attempting to fetch CSRF token (${i + 1}/3)...`);
          const res = await apiGetCsrfToken();
          if (res.success) {
            setCsrfToken(res.token);
            console.log('[LoginFlow] CSRF token fetched successfully.');
            break;
          }
        } catch (error) {
          console.error(`[LoginFlow] Failed to fetch CSRF token (attempt ${i + 1}/3):`, error);
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };

    initConnection();
  }, []);

  const handleLoginSuccess = async (data: { identifier?: string; username?: string; password: string }) => {
    setIsLoading(true)
    setError('')
    
    try {
      let encryptedPassword = data.password
      if (publicKey) {
        const publicKeyFromPem = forge.pki.publicKeyFromPem(publicKey)
        encryptedPassword = forge.util.encode64(publicKeyFromPem.encrypt(data.password, 'RSA-OAEP'))
      }

      // 调用登录API（支持identifier或username）
      const response = await apiLogin({ identifier: data.identifier, username: data.username, password: encryptedPassword }, csrfToken)
      if (response.success) {
        setSessionId(response.sessionId)
        setShowSmsModal(true)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.response?.data?.error || '登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigateToRegister = () => {
    navigate(PATHS.register)
  }

  const handleNavigateToForgotPassword = () => {
    // TODO: 实现跳转到忘记密码页面
    console.log('Navigate to forgot password')
  }

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
        
        // Update global auth state immediately
        // Note: Backend might return user info in different structure, ensuring we extract it correctly
        const userData = response.user || { username: '用户', id: response.userId || 'unknown' };
        const token = response.token;
        
        if (token) {
          login(token, userData);
          console.log('Global auth state updated');
        } else {
          console.error('Login successful but no token received');
        }

        setSmsSuccess('登录成功！')
        // 2秒后关闭弹窗并跳转
        setTimeout(() => {
          setShowSmsModal(false)
          // 跳转到之前的页面或首页
          navigate(from, { replace: true })
        }, 2000)
      }
    } catch (error: any) {
      console.error('SMS verification error:', error)
      console.log('错误响应数据:', error.response?.data)
      console.log('错误状态码:', error.response?.status)
      const errorMsg = error.response?.data?.error || '验证码校验失败，请重试'
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
