/**
 * 统一验证工具类
 */
const validators = {
  // 验证用户名格式：6-30位，字母开头，只能包含字母、数字、下划线
  validateUsername: (username) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{5,29}$/;
    return usernameRegex.test(username);
  },

  // 验证邮箱格式
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 验证手机号格式
  validatePhone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 验证身份证号格式 (简单正则)
  validateIdCard: (idCard) => {
    // 15位或18位身份证
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  },

  // 识别标识符类型
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
