import axios from 'axios'
import { tokenStorage } from '../utils/tokenStorage'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  return config
})

let refreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      original._retry = true
      refreshing = true

      // ✅ retry এও FormData check
      if (original.data instanceof FormData) {
        delete original.headers['Content-Type']
        delete original.headers['content-type']
      }

      try {
        const userId       = tokenStorage.getUser()?.id
        const refreshToken = tokenStorage.getRefresh()
        const { data }     = await axios.post('/api/v1/auth/refresh-token', {
          userId,
          refreshToken,
        })
        const newAccess  = data.accessToken
        const newRefresh = data.refreshToken
        tokenStorage.setAccess(newAccess)
        if (newRefresh) tokenStorage.setRefresh(newRefresh)
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return client(original)
      } catch (e) {
        processQueue(e, null)
        tokenStorage.clearAll()
        window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default client