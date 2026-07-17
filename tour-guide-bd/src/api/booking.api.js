import client from './client'

export const bookingApi = {
  create: function(payload) {
    return client.post('/guide/bookings', payload)
  },
  confirmPayment: function(bookingId, payload) {
    return client.post('/guide/bookings/' + bookingId + '/confirm-payment', payload)
  },
  getMyBookings: function(params) {
    return client.get('/guide/my-bookings', { params: params })
  },
  getMyBookingById: function(bookingId) {
    return client.get('/guide/my-bookings/' + bookingId)
  },
}