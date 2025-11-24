export function useValidation() {
  const isEmpty = (v?: string) => !v || v.trim() === ''
  const minLen = (v: string, n: number) => v.length >= n

  const validateLogin = (username: string, password: string) => {
    if (isEmpty(username)) return '请填写用户名'
    if (isEmpty(password)) return '请填写密码'
    if (!/^[A-Za-z0-9]+$/.test(password)) return '密码仅支持字母和数字'
    if (!minLen(password, 8) || !(/[A-Za-z]/.test(password) && /\d/.test(password))) return '密码至少8位且包含字母和数字'
    return ''
  }

  return { validateLogin }
}
