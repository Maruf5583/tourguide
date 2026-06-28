import client from './client'
import { tokenStorage } from '../utils/tokenStorage'

export const usersApi = {
  getMe:    () => client.get('/users/me'),
  updateMe: (data) => client.put('/users/me', data),

  // Azure Blob — multipart/form-data
  uploadAvatar: (file) => {
  const fd = new FormData()
  fd.append('file', file)   // ASP.NET expects 'file'
  return client.post('/users/me/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
},

  getFavourites:     () => client.get('/users/me/favourites'),
  addFavourite:      (placeId) => client.post(`/users/me/favourites/${placeId}`),
  removeFavourite:   (placeId) => client.delete(`/users/me/favourites/${placeId}`),
  getVisitHistory:   (params)  => client.get('/users/me/visit-history', { params }),
  checkIn:           (placeId, data) => client.post(`/users/me/check-in/${placeId}`, data),
  getCheckIns:       (params)  => client.get('/users/me/check-ins', { params }),
  getSavedDistricts: () => client.get('/users/me/saved-districts'),
  saveDistrict:      (id) => client.post(`/users/me/saved-districts/${id}`),
  removeDistrict:    (id) => client.delete(`/users/me/saved-districts/${id}`),
}