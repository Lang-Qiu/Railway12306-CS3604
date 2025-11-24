const express = require('express');
const authController = require('../request-handlers/authController');

const router = express.Router();

// API-POST-Login: 用户登录接口
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// API-POST-SendVerificationCode: 发送短信验证码接口
router.post('/send-verification-code', authController.sendVerificationCode);

// API-POST-VerifyLogin: 短信验证登录接口
router.post('/verify-login', authController.verifyLogin);

// API-GET-HomePage: 获取首页内容接口
router.get('/homepage', authController.getHomePage);

// API-GET-ForgotPassword: 忘记密码页面接口
router.get('/forgot-password', authController.getForgotPassword);

// API-GET-PublicKey: 获取公钥接口
router.get('/public-key', authController.getPublicKey);
router.get('/csrf-token', authController.getCsrfToken);

// Dev-only registration and user query
router.post('/dev/register', authController.devRegister);
router.get('/dev/user', authController.devGetUser);
router.post('/dev/json-register', authController.devJsonRegister);
router.get('/dev/json-user', authController.devJsonUser);

module.exports = router;
