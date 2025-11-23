import axios from 'axios'

export async function login(payload: { identifier?: string; username?: string; password: string }, csrfToken?: string) {
  const res = await axios.post('/api/auth/login', {
    identifier: payload.identifier || payload.username,
    password: payload.password,
  }, {
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    withCredentials: true,
  })
  return (res as any).data
}

export async function sendVerificationCode(payload: { sessionId?: string; idCardLast4?: string; phoneNumber?: string }) {
  const res = await axios.post('/api/auth/send-verification-code', payload)
  return (res as any).data
}

export async function verifyLogin(payload: { sessionId?: string; idCardLast4?: string; verificationCode: string; phoneNumber?: string }) {
  const res = await axios.post('/api/auth/verify-login', payload)
  return (res as any).data
}

export async function getPublicKey() {
  const res = await axios.get('/api/auth/public-key');
  return (res as any).data;
}

export async function getCsrfToken() {
  const res = await axios.get('/api/auth/csrf-token', { withCredentials: true });
  return (res as any).data;
}
