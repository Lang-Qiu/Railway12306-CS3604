/**
 * 验证工具类
 * 提供常用的格式验证函数，保持前后端逻辑一致
 */

// 身份证号码验证
export const validateIdCard = (idCard: string): boolean => {
  // 简单的正则验证：15位或18位，最后一位可以是数字或X
  const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!regex.test(idCard)) {
    return false;
  }
  
  // 18位身份证校验码验证
  if (idCard.length === 18) {
    const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const parity = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard.charAt(i)) * factors[i];
    }
    
    const expectedParity = parity[sum % 11];
    return expectedParity === idCard.charAt(17).toUpperCase();
  }
  
  return true;
};

// 手机号码验证
export const validatePhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

// 邮箱验证
export const validateEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
};

// 密码强度验证 (至少8位，包含字母和数字)
export const validatePassword = (password: string): boolean => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
};

export const validators = {
  validateIdCard,
  validatePhone,
  validateEmail,
  validatePassword
};

export default validators;
