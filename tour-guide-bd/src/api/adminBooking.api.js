import client from './client'

export const adminBookingApi = {
  getAll: function(params) {
    return client.get('/admin/bookings', { params: params })
  },
  getById: function(bookingId) {
    return client.get('/admin/bookings/' + bookingId)
  },
}

export const guideRevenueApi = {
  getRevenue: function(year) {
    return client.get('/guide/revenue', { params: { year: year } })
  },
}