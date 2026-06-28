import client from './client'

export const adminApi = {
  getAnalytics:   () => client.get('/admin/analytics'),
  getUsers:       (params) => client.get('/admin/users', { params }),
  banUser:        (userId, data) => client.patch(`/admin/users/${userId}/ban`, data),
  assignRole:     (userId, data) => client.patch(`/admin/users/${userId}/role`, data),
  getPendingPlaces:(params) => client.get('/admin/places/pending', { params }),
  broadcast:      (data)   => client.post('/admin/broadcast', data),
  flushCache:     (data)   => client.post('/admin/cache/flush', data),
  getAuditLogs:   (params) => client.get('/admin/audit-logs', { params }),
}