export function useValidation() {
  const isEmpty = (v?: string) => !v || v.trim() === ''
  const minLen = (v: string, n: number) => v.length >= n

  const validateLogin = (username: string, password: string) => {
    if (isEmpty(username)) return '请填写用户名'
    if (isEmpty(password)) return '请填写密码'
    if (!minLen(password, 6)) return '密码至少6位'
    return ''
  }

  return { validateLogin }
}
