// src/pages/admin/AdminWithdrawals.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminFinanceApi } from '../../api/adminFinance.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

function fmt(n) { return '৳' + Number(n || 0).toLocaleString() }

function ActionModal(props) {
  var withdrawal = props.withdrawal
  var mode = props.mode // 'approve' | 'reject'
  var onClose = props.onClose
  var onConfirm = props.onConfirm
  var isPending = props.isPending
  var [transactionReference, setTransactionReference] = useState('')
  var [rejectionReason, setRejectionReason] = useState('')

  return (
    <Modal isOpen={!!withdrawal} onClose={onClose} title={mode === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}>
      {withdrawal && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{withdrawal.guideName}</span> — {fmt(withdrawal.requestedAmount)} ({withdrawal.paymentMethodType})
          </p>

          {mode === 'approve' && (
            <input value={transactionReference} onChange={function(e) { setTransactionReference(e.target.value) }}
              placeholder="Transaction reference" className="input" />
          )}
          {mode === 'reject' && (
            <textarea value={rejectionReason} onChange={function(e) { setRejectionReason(e.target.value) }}
              placeholder="Rejection reason" className="input" rows={3} />
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
           <button
  onClick={function() {
    onConfirm(mode === 'approve'
      ? { isApproved: true, transactionReference: transactionReference, adminNote: '' }
      : { isApproved: false, adminNote: rejectionReason })
  }}
  disabled={isPending}
  className={'flex-1 rounded-xl py-2 text-sm font-medium text-white disabled:opacity-50 ' + (mode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}
>
              {isPending ? 'Processing...' : (mode === 'approve' ? 'Confirm Approve' : 'Confirm Reject')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function AdminWithdrawals() {
  var qc = useQueryClient()
  var [year] = useState(new Date().getFullYear())
  var [actionTarget, setActionTarget] = useState(null) // { withdrawal, mode }

  // Pending withdrawal list financial-dashboard theke ashe (alada GET endpoint nai bole)
  var queryResult = useQuery({
    queryKey: ['admin-financial-dashboard', year],
    queryFn: function() { return adminFinanceApi.getFinancialDashboard(year).then(function(r) { return r.data }) },
    retry: false,
  })

  var processMutation = useMutation({
    mutationFn: function(vars) { return adminFinanceApi.processWithdrawal(vars.id, vars.data) },
    onSuccess: function() {
      toast.success('Withdrawal process kora holo')
      qc.invalidateQueries({ queryKey: ['admin-financial-dashboard'] })
      setActionTarget(null)
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Process korte parlam na')
    },
  })

  if (queryResult.isLoading) return <LoadingSpinner center />
  if (queryResult.isError) return <div className="text-center py-16 text-gray-400">Withdrawals load hocche na.</div>

  var list = (queryResult.data && queryResult.data.pendingWithdrawalList) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guide Withdrawals</h1>
        <p className="text-sm text-gray-400 mt-0.5">{list.length} pending request{list.length !== 1 ? 's' : ''}</p>
      </div>

      {list.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
          <Clock size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Kono pending withdrawal nai</p>
        </div>
      )}

      <div className="space-y-3">
        {list.map(function(w) {
          return (
            <div key={w.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{w.guideName}</p>
                  <p className="text-xs text-gray-400">{w.paymentMethodType} · {new Date(w.requestedAt).toLocaleDateString('en-BD')}</p>
                </div>
                <p className="text-lg font-bold text-primary-600">{fmt(w.requestedAmount)}</p>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                {w.paymentMethodType === 'Bank'
                  ? (w.bankName + ' · ' + w.accountNumber)
                  : w.mobileNumber}
                {' · '}Net: {fmt(w.netAmount)}
              </div>

              <div className="flex gap-2 border-t pt-3">
                <button
                  onClick={function() { setActionTarget({ withdrawal: w, mode: 'approve' }) }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={function() { setActionTarget({ withdrawal: w, mode: 'reject' }) }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm border border-red-100 text-red-600 py-2 rounded-xl hover:bg-red-50"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ActionModal
        withdrawal={actionTarget && actionTarget.withdrawal}
        mode={actionTarget && actionTarget.mode}
        isPending={processMutation.isPending}
        onClose={function() { setActionTarget(null) }}
        onConfirm={function(data) { processMutation.mutate({ id: actionTarget.withdrawal.id, data: data }) }}
      />
    </div>
  )
}