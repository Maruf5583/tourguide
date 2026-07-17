// src/api/adminFinance.api.js
import client from './client'

export const adminFinanceApi = {
  getFinancialDashboard: function(year) {
    return client.get('/admin/financial-dashboard', { params: { year: year } })
  },
  processWithdrawal: function(withdrawalId, data) {
    // data-r moddhe already withdrawalId thakbe, tai eikhane merge kore pathacchi
    return client.patch('/admin/withdrawals/' + withdrawalId + '/process', Object.assign({ withdrawalId: withdrawalId }, data))
  },
}