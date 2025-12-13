const express = require('express');
const router = express.Router();

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    const dbService = require('../domain-providers/dbService');
    const row = await dbService.get('SELECT username, email, phone, discount_type FROM users ORDER BY id DESC LIMIT 1');
    if (!row) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ username: row.username, email: row.email, phone: row.phone, discountType: row.discount_type });
  } catch (error) {
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// PUT /api/user/email
router.put('/email', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: '请输入有效的电子邮件地址！' });
    const dbService = require('../domain-providers/dbService');
    const target = await dbService.get('SELECT id FROM users ORDER BY id DESC LIMIT 1');
    if (!target) return res.status(404).json({ error: 'User not found' });
    await dbService.run('UPDATE users SET email = ? WHERE id = ?', [email, target.id]);
    return res.status(200).json({ message: '邮箱更新成功' });
  } catch (error) {
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// PUT /api/user/phone
router.put('/phone', async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { newPhone, verificationCode, password } = req.body;
    if (!newPhone || !/^\d{11}$/.test(newPhone)) return res.status(400).json({ error: '您输入的手机号码不是有效的格式！' });
    if (!verificationCode || !/^\d{6}$/.test(verificationCode)) return res.status(400).json({ error: '验证码必须为6位数字' });
    if (!password || password.length < 6) return res.status(400).json({ error: '密码长度不能少于6位' });
    const dbService = require('../domain-providers/dbService');
    const target = await dbService.get('SELECT id, password FROM users ORDER BY id DESC LIMIT 1');
    if (!target) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(password, target.password);
    if (!ok) return res.status(401).json({ error: '用户名或密码错误' });
    await dbService.run('UPDATE users SET phone = ? WHERE id = ?', [newPhone, target.id]);
    return res.status(200).json({ message: '手机号更新成功' });
  } catch (error) {
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// PUT /api/user/discount-type
router.put('/discount-type', async (req, res, next) => {
  try {
    const { discountType } = req.body;
    if (!discountType) return res.status(400).json({ error: '优惠类型不能为空' });
    const dbService = require('../domain-providers/dbService');
    const target = await dbService.get('SELECT id FROM users ORDER BY id DESC LIMIT 1');
    if (!target) return res.status(404).json({ error: 'User not found' });
    await dbService.run('UPDATE users SET discount_type = ? WHERE id = ?', [discountType, target.id]);
    return res.status(200).json({ message: '优惠类型更新成功' });
  } catch (error) {
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
