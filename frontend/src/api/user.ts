import client from './client';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  idType: string;
  idNumber: string;
  verificationStatus: string;
  phone: string;
  email: string;
  discountType: string;
}

// Mock data for development (fallback)
const MOCK_USER: UserProfile = {
  id: '12345',
  username: 'zhangsan',
  name: '王小明', // Example name
  idType: '1', // 1 for ID Card
  idNumber: '110101199003078888',
  verificationStatus: '已通过',
  phone: '13812345678',
  email: 'wangxiaoming@example.com',
  discountType: '成人',
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await client.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.warn('API call failed', error);
    throw error; // Let the caller handle it (e.g. redirect to login if 401)
  }
};

export const updateUserEmail = async (email: string): Promise<void> => {
  try {
    await client.put('/api/user/email', { email });
    MOCK_USER.email = email; // Keep mock in sync just in case
  } catch (error) {
    console.warn('API call failed, using mock data', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    MOCK_USER.email = email;
  }
};

export const updateUserDiscountType = async (discountType: string): Promise<void> => {
  try {
    await client.put('/api/user/discount-type', { discountType });
    MOCK_USER.discountType = discountType;
  } catch (error) {
    console.warn('API call failed, using mock data', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    MOCK_USER.discountType = discountType;
  }
};

export const validatePassword = async (password: string): Promise<boolean> => {
  // Ideally this would be an API call too, e.g. /api/user/verify-password
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Mock validation - accept any password for now or specific one
  return true;
};

export const sendChangePhoneCode = async (phone: string): Promise<void> => {
  try {
    // Assuming backend has this endpoint
    await client.post('/api/user/send-phone-code', { phone });
  } catch (error) {
    console.warn('API call failed, using mock', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Verification code sent to ${phone}`);
  }
};

export const updateUserPhone = async (newPhone: string, code: string, password: string): Promise<void> => {
  try {
    await client.put('/api/user/phone', { newPhone, verificationCode: code, password });
    MOCK_USER.phone = newPhone;
  } catch (error) {
    console.warn('API call failed, using mock', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (code !== '123456') { // Mock verification code check
       throw new Error('验证码错误');
    }
    MOCK_USER.phone = newPhone;
  }
};
