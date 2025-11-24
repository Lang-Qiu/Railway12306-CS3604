import axios from 'axios'

export async function sendResetPasswordCode(identifier: string, idNumber: string) {
  const res = await axios.post('/api/auth/send-reset-password-code', { identifier, idNumber })
  return (res as any).data
}

export async function verifyResetPasswordCode(sessionId: string, verificationCode: string) {
  const res = await axios.post('/api/auth/verify-reset-password-code', { sessionId, verificationCode })
  return (res as any).data
}

export async function resetPassword(sessionId: string, newPassword: string) {
  const res = await axios.post('/api/auth/reset-password', { sessionId, newPassword })
  return (res as any).data
}

