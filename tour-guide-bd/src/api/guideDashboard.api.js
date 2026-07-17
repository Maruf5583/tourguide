// src/api/guideDashboard.api.js
import client from './client' // ⚠️ tomar actual axios instance file er path bosao

export const guideDashboardApi = {
  // Bookings
  getMyBookings: function(params) {
    return client.get('/guide/my-guide-bookings', { params: params })
  },
  completeBooking: function(bookingId) {
    return client.patch('/guide/bookings/' + bookingId + '/complete')
  },

  // Balance
  getBalance: function() {
    return client.get('/guide/my-balance')
  },

  // Payment Methods
  getPaymentMethods: function() {
    return client.get('/guide/payment-methods')
  },
  addPaymentMethod: function(data) {
    return client.post('/guide/payment-methods', data)
  },
  deletePaymentMethod: function(id) {
    return client.delete('/guide/payment-methods/' + id)
  },

  // Withdrawal
  requestWithdrawal: function(data) {
    return client.post('/guide/withdrawal-request', data)
  },
  getWithdrawalHistory: function(params) {
    return client.get('/guide/withdrawal-history', { params: params })
  },
}

export const reviewApi = {
  submitReview: function(bookingId, data) {
    return axiosInstance.post('/guide/bookings/' + bookingId + '/review', data)
  },
}