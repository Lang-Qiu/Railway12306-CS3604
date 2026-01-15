/**
 * Unified validation utilities
 */
const validators = {
  // Validate username format: 6-30 chars, starts with letter, alphanumeric and underscore only
  validateUsername: (username) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{5,29}$/;
    return usernameRegex.test(username);
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number format
  validatePhone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // Validate ID card format (simple regex)
  validateIdCard: (idCard) => {
    // 15 or 18 digits
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  },

  // Identify identifier type
  identifyIdentifierType: (identifier) => {
    if (validators.validateEmail(identifier)) {
      return 'email';
    } else if (validators.validatePhone(identifier)) {
      return 'phone';
    } else if (validators.validateUsername(identifier)) {
      return 'username';
    }
    return 'invalid';
  }
};

module.exports = validators;
