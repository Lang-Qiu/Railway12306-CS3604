import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/'

const client = axios.create({
  baseURL,
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  config.headers = config.headers || {}
  config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const data = error?.response?.data
    return Promise.reject({ status, data, message: error.message })
  }
)

export default client
