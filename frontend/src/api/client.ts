import axios from 'axios'

export const TOKEN_KEY = 'edusentiai-token'

const api = axios.create({
  baseURL: '/edusentiai/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the stored JWT (stateless auth — sessions don't survive serverless).
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    /* ignore */
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        /* ignore */
      }
    }
    return Promise.reject(err)
  }
)

export default api
