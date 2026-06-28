import client from './client'

export const authApi = {
  register:     (data) => client.post('/auth/register', data),
  login:        (data) => client.post('/auth/login', data),
  refreshToken: (data) => client.post('/auth/refresh-token', data),
  logout:       (data) => client.post('/auth/logout', data),
}