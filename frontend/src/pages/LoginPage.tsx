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
          setPublicKey(response.publicKey || '');
        } else {
          setPublicKey('');
        }
      } catch (error) {
        setPublicKey('');
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
      const status = error?.response?.status
      const errMsg = error?.response?.data?.error
      let msg = '登录失败，请稍后重试'
      if (!error?.response) {
        msg = '网络异常，请检查连接'
      } else if (status === 403 && errMsg && /CSRF/i.test(errMsg)) {
        msg = '页面安全校验失败，请刷新后重试'
        try {
          const res = await apiGetCsrfToken()
          if (res.success) setCsrfToken(res.token)
        } catch {}
      } else if (status === 401) {
        msg = errMsg || '用户名或密码错误'
      } else if (status === 429) {
        msg = errMsg || '请求过于频繁，请稍后再试'
      } else if (status === 500) {
        msg = '服务器繁忙，请稍后重试'
      } else if (errMsg) {
        msg = errMsg
      }
      setError(msg)
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
        setSmsSuccess('登录成功！')
        // 2秒后关闭弹窗并跳转
        setTimeout(() => {
          setShowSmsModal(false)
          // TODO: 跳转到首页或用户中心
          navigate('/')
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
