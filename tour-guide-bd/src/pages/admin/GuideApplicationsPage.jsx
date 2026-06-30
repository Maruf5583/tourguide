import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { usePagination } from '../../hooks/usePagination'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { UserCheck, Check, X, Eye, ExternalLink, Trash2 } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '',  label: 'All' },
  { value: 0,   label: 'Pending' },
  { value: 1,   label: 'Under Review' },
  { value: 2,   label: 'Approved' },
  { value: 3,   label: 'Rejected' },
]

const STATUS = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  APPROVED: 2,
  REJECTED: 3,
}

function getStatusLabel(status) {
  switch (status) {
    case STATUS.APPROVED:    return 'Approved'
    case STATUS.REJECTED:    return 'Rejected'
    case STATUS.UNDER_REVIEW: return 'Under Review'
    default:                 return 'Pending'
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case STATUS.APPROVED:    return 'bg-green-100 text-green-700'
    case STATUS.REJECTED:    return 'bg-red-100 text-red-700'
    case STATUS.UNDER_REVIEW: return 'bg-blue-100 text-blue-700'
    default:                 return 'bg-amber-100 text-amber-700'
  }
}

function isReviewable(status) {
  return status === STATUS.PENDING || status === STATUS.UNDER_REVIEW
}

function DocImage({ label, url }) {
  if (!url) return null
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="block relative rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-colors group">
        <img src={url} alt={label} className="w-full h-32 object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ExternalLink size={18} className="text-white" />
        </div>
      </a>
    </div>
  )
}

export default function GuideApplicationsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [status, setStatus]           = useState('')
  const [selected, setSelected]       = useState(null)
  const [note, setNote]               = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removeReason, setRemoveReason] = useState('')
  const { pageNumber, pageSize, nextPage, prevPage, goToPage, reset } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['guide-applications', status, pageNumber],
    queryFn: () => guideApi.getApplications({
      status: status !== '' ? Number(status) : undefined,
      pageNumber, pageSize,
    }).then(r => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, isApproved, note }) =>
      guideApi.reviewApplication(id, {
        applicationId: id,
        isApproved,
        adminNote:    note,
        adminUserId:  user?.id || '',
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.isApproved ? 'Application approved ✅' : 'Application rejected')
      qc.invalidateQueries({ queryKey: ['guide-applications'] })
      setSelected(null)
    },
    onError: () => toast.error('Action failed'),
  })

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }) => {
      console.log('Removing guide id:', id, 'reason:', reason)
      return guideApi.removeGuide(id, reason)
    },
    onSuccess: () => {
      toast.success('Guide removed')
      qc.invalidateQueries({ queryKey: ['guide-applications'] })
      setRemoveTarget(null)
      setRemoveReason('')
    },
    onError: () => toast.error('Remove failed'),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck size={20} className="text-primary-600" /> Guide applications
        </h1>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(s => (
            <button key={s.label} onClick={() => { setStatus(s.value); reset() }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                status === s.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!data?.items?.length ? (
        <div className="card p-12 text-center text-gray-400">No applications found</div>
      ) : (
        <div className="space-y-3">
          {data.items.map(app => (
            <div key={app.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0 overflow-hidden">
                {app.profilePhotoUrl
                  ? <img src={app.profilePhotoUrl} alt={app.fullName} className="w-full h-full object-cover" />
                  : app.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{app.fullName}</p>
                <p className="text-xs text-gray-400">
                  {app.phone} · Applied {formatDate(app.appliedAt)}
                </p>
              </div>
              <span className={`badge text-xs ${getStatusBadgeClass(app.status)}`}>
                {getStatusLabel(app.status)}
              </span>
              <div className="flex gap-2 shrink-0">
                {/* Eye — সব status এ */}
                <button onClick={() => { setSelected(app); setNote('') }}
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600">
                  <Eye size={15} />
                </button>
                {/* Trash — শুধু Approved এ */}
                {app.status === STATUS.APPROVED && (
                  <button onClick={() => { setRemoveTarget(app); setRemoveReason('') }}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700">
                    <Trash2 size={15} />
                  </button>
                )}
                {/* Approve/Reject — Pending বা UnderReview এ */}
                {isReviewable(app.status) && (
                  <>
                    <button
                      onClick={() => reviewMutation.mutate({ id: app.id, isApproved: true, note: '' })}
                      disabled={reviewMutation.isPending}
                      className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700">
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({ id: app.id, isApproved: false, note: '' })}
                      disabled={reviewMutation.isPending}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700">
                      <X size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
        hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
        onPrev={prevPage} onNext={nextPage} onPage={goToPage} />

      {/* ✅ Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Application details">
        {selected && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                ['Name',          selected.fullName],
                ['Phone',         selected.phone],
                ['Address',       selected.address],
                ['Date of Birth', selected.dateOfBirth
                                    ? new Date(selected.dateOfBirth).toLocaleDateString()
                                    : '—'],
                ['Experience',    selected.experienceYears
                                    ? `${selected.experienceYears} years`
                                    : '—'],
                ['Daily Rate',    selected.dailyRate ? `৳${selected.dailyRate}` : '—'],
                ['Languages',     Array.isArray(selected.languages)
                                    ? selected.languages.join(', ')
                                    : selected.languages || '—'],
                ['Specialities',  Array.isArray(selected.specialities)
                                    ? selected.specialities.join(', ')
                                    : selected.specialities || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
              {selected.bio && (
                <div>
                  <span className="text-gray-500 block mb-1">Bio</span>
                  <p className="text-gray-700 text-xs leading-relaxed">{selected.bio}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">Documents</p>
              <div className="grid grid-cols-2 gap-3">
                <DocImage label="🪪 NID Front"         url={selected.nidFrontPhotoUrl} />
                <DocImage label="🪪 NID Back"          url={selected.nidBackPhotoUrl} />
                <DocImage label="📄 Birth Certificate" url={selected.dobCertificatePhotoUrl} />
                <DocImage label="📷 Profile Photo"     url={selected.profilePhotoUrl} />
                {selected.certificateUrl && (
                  <div className="col-span-2">
                    <DocImage label="📜 Guide Certificate" url={selected.certificateUrl} />
                  </div>
                )}
              </div>
            </div>

            {/* Review actions */}
            {isReviewable(selected.status) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review note (optional)
                  </label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Add a note for the applicant…" rows={3}
                    className="input resize-none" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => reviewMutation.mutate({ id: selected.id, isApproved: true, note })}
                    disabled={reviewMutation.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Check size={15} /> Approve
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: selected.id, isApproved: false, note })}
                    disabled={reviewMutation.isPending}
                    className="btn-danger flex-1 flex items-center justify-center gap-2">
                    <X size={15} /> Reject
                  </button>
                </div>
              </>
            )}

            {!isReviewable(selected.status) && (
              <div className={`rounded-xl p-3 text-sm text-center font-medium ${
                selected.status === STATUS.APPROVED
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {selected.status === STATUS.APPROVED
                  ? '✅ This application has been approved'
                  : '❌ This application has been rejected'}
                {selected.adminNote && (
                  <p className="text-xs mt-1 font-normal opacity-80">Note: {selected.adminNote}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ✅ Remove Modal */}
      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Guide">
        {removeTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{removeTarget.fullName}</span> কে remove করতে চাও?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                placeholder="Reason for removing this guide…"
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate({ id: removeTarget.guideProfileId ?? removeTarget.id, reason: removeReason })}
                disabled={!removeReason.trim() || removeMutation.isPending}
                className="btn-danger flex-1 flex items-center justify-center gap-2">
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}