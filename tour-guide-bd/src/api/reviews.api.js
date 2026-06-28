import client from './client'

export const reviewsApi = {
  getByPlace:   (placeId, params) => client.get(`/reviews/place/${placeId}`, { params }),
  create:       (data)   => client.post('/reviews', data),

  // Azure Blob — multiple files
  uploadPhotos: (files) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    return client.post('/reviews/photos', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  report:        (reviewId, data)  => client.post(`/reviews/${reviewId}/report`, data),
  getPending:    (params)          => client.get('/reviews/pending', { params }),
  approve:       (reviewId, data)  => client.patch(`/reviews/${reviewId}/approval`, data),
  getReports:    (params)          => client.get('/reviews/reports', { params }),
  resolveReport: (reportId, data)  => client.patch(`/reviews/reports/${reportId}/resolve`, data),
}