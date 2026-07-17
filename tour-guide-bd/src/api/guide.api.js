import client from './client'

export const guideApi = {
  uploadDocument: async (file, docType) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await client.post('/guide/upload-documents', formData, {
      params: { docType },
    })
    return data.url // exact response shape: { url, docType }
  },

  apply: (payload) => client.post('/guide/apply', payload),

  getApplications: ({ status, pageNumber = 1, pageSize = 10 } = {}) =>
    client.get('/guide/applications', { params: { status, pageNumber, pageSize } }),

  reviewApplication: (id, payload) =>
    client.patch(`/guide/applications/${id}/review`, payload),

  removeGuide: (guideProfileId, payload) =>
    client.delete(`/guide/${guideProfileId}/remove`, { data: payload }),

  getGuides: (params) => client.get('/guide', { params }),
  getGuideDetail: (guideId) => client.get(`/guide/${guideId}`),
}