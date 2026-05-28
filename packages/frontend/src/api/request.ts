import axios from 'axios'
import { ElMessage } from 'element-plus'

// In Capacitor: use __API_BASE__ (both local and remote mode)
// In browser: use /api through Nginx/Vite proxy
const apiBase = (window as any).Capacitor
  ? ((window as any).__API_BASE__ || '/api')
  : '/api';

const request = axios.create({
  baseURL: apiBase,
  timeout: 30000,
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
