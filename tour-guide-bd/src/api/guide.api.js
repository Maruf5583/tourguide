import client from './client'

export const guideApi = {
  apply:            (data)          => client.post('/guide/apply', data),
  uploadDocument:   (file, docType) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post('/guide/upload-documents', fd, { params: { docType } })
  },

  removeGuide: (guideProfileId, reason) =>
    client.delete(`/guide/${guideProfileId}/remove`, { data: { reason } }),

  getApplications:   (params)   => client.get('/guide/applications', { params }),
  reviewApplication: (id, data) => client.patch(`/guide/applications/${id}/review`, {
    ...data, applicationId: Number(id),
  }),

  createPackage:  (data)              => client.post('/guide/packages', data),
  updatePackage:  (packageId, data)   => client.put(`/guide/packages/${packageId}`, data),
  deletePackage:  (packageId)         => client.delete(`/guide/packages/${packageId}`),

  // ✅ REMOVED: getPackageById — backend e ei endpoint nai
  // Fetch single package from my-packages list instead
  getPackageById: (packageId) =>
    client.get('/guide/my-packages').then((res) => {
      const list = res.data?.$values || res.data || []
      const found = list.find((p) => String(p.id) === String(packageId))
      if (!found) throw new Error('Package not found')
      return { data: found }
    }),

  createBooking:  (data)      => client.post('/guide/bookings', data),
  updateLocation: (data)      => client.post('/guide/location/update', data),
  stopLocation:   (bookingId) => client.post(`/guide/location/stop/${bookingId}`),
  getRevenue:     (year)      => client.get('/guide/revenue', { params: { year } }),

  getGuides:       (params)  => client.get('/guide', { params }),
  getGuideProfile: (guideId) => client.get(`/guide/${guideId}`),
  getMyPackages:   ()        => client.get('/guide/my-packages'),

  // ── My bookings (Guide-side) ──
  getMyBookings: (params) =>
    client.get('/guide/my-bookings', { params }),

  getMyBookingById: (bookingId) =>
    client.get(`/guide/my-bookings/${bookingId}`),
}