const jwt = require('jsonwebtoken');
const jsonDbService = require('../domain-providers/jsonDbService');

const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-default-secret';
    const decoded = jwt.verify(token, secret);
    
    // Support both userId (new) and id (old/legacy)
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.error('Token payload missing userId/id:', decoded);
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // Fetch user from DB to ensure they still exist and get latest data
    const user = await jsonDbService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = verifyToken;
