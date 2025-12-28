const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const jsonDbService = require('../domain-providers/jsonDbService');

// GET /api/user/profile
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const profile = {
      id: user.userId,
      username: user.username,
      name: user.name,
      idType: user.idCardType || '1',
      idNumber: user.idCardNumber,
      verificationStatus: '已通过',
      phone: user.phone,
      email: user.email,
      discountType: user.discountType || '成人'
    };
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/email
router.put('/email', verifyToken, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    // Check if email is already taken
    const existingUser = await jsonDbService.findUserBy(email, 'email');
    if (existingUser && existingUser.userId !== req.user.userId) {
      return res.status(409).json({ error: 'Email is already in use' });
    }

    await jsonDbService.updateUser(req.user.userId, { email });
    res.json({ success: true });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// PUT /api/user/phone
router.put('/phone', verifyToken, async (req, res, next) => {
  // TODO: Implement update user phone with verification code
  res.status(501).json({ error: 'Not Implemented' });
});

// PUT /api/user/discount-type
router.put('/discount-type', verifyToken, async (req, res, next) => {
  try {
    const { discountType } = req.body;
    if (!discountType) return res.status(400).json({ error: 'Discount type is required' });

    await jsonDbService.updateUser(req.user.userId, { discountType });
    res.json({ success: true });
  } catch (error) {
    console.error('Update discount type error:', error);
    res.status(500).json({ error: 'Failed to update discount type' });
  }
});

module.exports = router;
