import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.error || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

export default {
  /**
   * 获取登录二维码
   */
  async getQRCode() {
    return await api.get('/login/qrcode')
  },

  /**
   * 钉钉内免登
   * @param {string} authCode - 免登授权码
   */
  async dingtalkInnerLogin(authCode) {
    return await api.post('/login/dingtalk_inner', { authCode })
  },

  /**
   * 处理登录回调（一般由后端处理，这里作为示例）
   * @param {string} code - 授权码
   * @param {string} state - 状态参数
   */
  async handleCallback(code, state) {
    return await api.get(`/login/callback?code=${code}&state=${state}`)
  }
} 