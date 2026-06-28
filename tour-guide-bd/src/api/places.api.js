import client from './client'

export const placesApi = {
  search:       (params) => client.get('/places/search', { params }),
  getAll:       (params) => client.get("/places", { params }),
  nearby:       (params) => client.get('/places/nearby', { params }),
  byDistrict:   (districtId, params) => client.get(`/places/by-district/${districtId}`, { params }),
  byCategory:   (category, params)   => client.get(`/places/by-category/${category}`, { params }),
  getById:      (id)       => client.get(`/places/${id}`),
  create:       (data)     => client.post('/places', data),
  update:       (id, data) => client.put(`/places/${id}`, data),
  remove:       (id)       => client.delete(`/places/${id}`),
  approve:      (id, data) => client.patch(`/places/${id}/approval`, data),

  uploadPhotos: (files) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    return client.post('/places/upload-photos', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}