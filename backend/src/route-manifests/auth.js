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

// API-POST-SendResetPasswordCode: 发送重置密码验证码
router.post('/send-reset-password-code', authController.sendResetPasswordCode);

// API-POST-VerifyResetPasswordCode: 验证重置密码验证码
router.post('/verify-reset-password-code', authController.verifyResetPasswordCode);

// API-POST-ResetPassword: 重置密码
router.post('/reset-password', authController.resetPassword);

// API-GET-PublicKey: 获取公钥接口
router.get('/public-key', authController.getPublicKey);
router.get('/csrf-token', authController.getCsrfToken);

module.exports = router;
