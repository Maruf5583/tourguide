import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Package,
  Clock, Users, MapPin, CheckCircle,
  Utensils, Car, Home, LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'
import { packageApi } from '../../api/package.api'
import PackageFormModal from '../../components/guide/PackageFormModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { useAuthStore } from '../../store/auth.store'

function InclusionBadge(props) {
  var Icon = props.icon
  var label = props.label
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
      <Icon size={11} />{label}
    </span>
  )
}

function PackageCard(props) {
  var pkg = props.pkg
  var onEdit = props.onEdit
  var onDelete = props.onDelete
  var inclusions = []
  if (pkg.includesFood) inclusions.push({ icon: Utensils, label: 'Food' })
  if (pkg.includesTransport) inclusions.push({ icon: Car, label: 'Transport' })
  if (pkg.includesAccommodation) inclusions.push({ icon: Home, label: 'Stay' })
  var isActive = pkg.isActive !== false
  var activeCls = isActive
    ? 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium'
    : 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium'
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{pkg.title}</h3>
          <span className={activeCls}>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-primary-600">{'৳' + Number(pkg.pricePerPerson).toLocaleString()}</p>
          <p className="text-xs text-gray-400">per person</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{pkg.description}</p>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        <span className="inline-flex items-center gap-1"><Clock size={12} />{pkg.durationDays} {pkg.durationDays === 1 ? 'day' : 'days'}</span>
        <span className="inline-flex items-center gap-1"><Users size={12} />Max {pkg.maxPeople}</span>
        <span className="inline-flex items-center gap-1"><CheckCircle size={12} className="text-green-500" />{pkg.completedBookings || 0} completed</span>
        <span className="inline-flex items-center gap-1"><Package size={12} />{pkg.totalBookings || 0} bookings</span>
      </div>
      {inclusions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {inclusions.map(function(item) { return <InclusionBadge key={item.label} icon={item.icon} label={item.label} /> })}
        </div>
      )}
      {pkg.meetingPoint && (
        <p className="inline-flex items-center gap-1 text-xs text-gray-400 mb-3"><MapPin size={11} />{pkg.meetingPoint}</p>
      )}
      {pkg.availableDates && pkg.availableDates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1 font-medium">Available dates</p>
          <div className="flex flex-wrap gap-1">
            {pkg.availableDates.slice(0, 5).map(function(d) {
              var dateStr = new Date(d).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
              return <span key={d} className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-lg">{dateStr}</span>
            })}
            {pkg.availableDates.length > 5 && <span className="text-xs text-gray-400 px-1">+{pkg.availableDates.length - 5} more</span>}
          </div>
        </div>
      )}
      <div className="flex gap-2 border-t pt-3">
        <button onClick={function() { onEdit(pkg) }} className="flex-1 inline-flex items-center justify-center gap-1 text-sm border border-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          <Pencil size={14} /> Edit
        </button>
        <button onClick={function() { onDelete(pkg) }} className="flex-1 inline-flex items-center justify-center gap-1 text-sm border border-red-100 text-red-600 py-2 rounded-xl hover:bg-red-50 transition-colors font-medium">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}

function ErrorState(props) {
  var status = props.status
  var navigate = useNavigate()
  var logout = useAuthStore(function(s) { return s.logout })
  function handleLogout() { logout(); navigate('/login') }

  if (status === 401 || status === 403) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-amber-100 rounded-2xl">
        <LogOut size={40} className="mx-auto text-amber-300 mb-3" />
        <p className="text-gray-700 font-semibold mb-1">Session outdated</p>
        <p className="text-sm text-gray-400 mb-4">Logout করে আবার login করুন — নতুন token-এ TourGuide role আসবে।</p>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <LogOut size={15} /> Logout &amp; Login again
        </button>
      </div>
    )
  }
  if (status === 400 || status === 404) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
        <Package size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-500 font-semibold mb-1">Guide profile not found</p>
        <p className="text-sm text-gray-400 mb-4">Application এখনো approved হয়নি।</p>
        <Link to="/become-a-guide" className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus size={15} /> Apply as Guide
        </Link>
      </div>
    )
  }
  return <div className="text-center py-16 border-2 border-dashed border-red-100 rounded-2xl"><p className="text-gray-400">Something went wrong. Please refresh.</p></div>
}

export default function MyPackagesPage() {
  var qc = useQueryClient()
  var [formOpen, setFormOpen] = useState(false)
  var [editTarget, setEditTarget] = useState(null)
  var [deleteTarget, setDeleteTarget] = useState(null)

  var queryResult = useQuery({
    queryKey: ['my-packages'],
    queryFn: function() { return packageApi.getMyPackages().then(function(r) { return r.data }) },
    retry: false,
  })

  var packages = queryResult.data
  var isLoading = queryResult.isLoading
  var isError = queryResult.isError
  var error = queryResult.error

  var deleteMutation = useMutation({
    mutationFn: function(id) { return packageApi.remove(id) },
    onSuccess: function() {
      toast.success('Package deleted')
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      setDeleteTarget(null)
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Delete failed')
    },
  })

  if (isLoading) return <LoadingSpinner center />

  if (isError) {
    var errStatus = error && error.response ? error.response.status : 0
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Packages</h1>
        <ErrorState status={errStatus} />
      </div>
    )
  }

  var pkgList = Array.isArray(packages) ? packages : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Packages</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pkgList.length} package{pkgList.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={function() { setEditTarget(null); setFormOpen(true) }} className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus size={16} /> New Package
        </button>
      </div>

      {pkgList.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
          <Package size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">No packages yet</p>
          <p className="text-sm text-gray-300 mb-4">Create your first tour package to get started</p>
          <button onClick={function() { setEditTarget(null); setFormOpen(true) }} className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            <Plus size={15} /> Create Package
          </button>
        </div>
      )}

      {pkgList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pkgList.map(function(pkg) {
            return (
              <PackageCard key={pkg.id} pkg={pkg}
                onEdit={function(p) { setEditTarget(p); setFormOpen(true) }}
                onDelete={function(p) { setDeleteTarget(p) }}
              />
            )
          })}
        </div>
      )}

      <PackageFormModal isOpen={formOpen} onClose={function() { setFormOpen(false); setEditTarget(null) }} editPackage={editTarget} />

      <Modal isOpen={!!deleteTarget} onClose={function() { setDeleteTarget(null) }} title="Delete Package">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600"><span className="font-semibold text-gray-900">"{deleteTarget.title}"</span> delete করতে চান?</p>
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">Active booking থাকলে package soft-delete হবে।</p>
            <div className="flex gap-3">
              <button onClick={function() { setDeleteTarget(null) }} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={function() { deleteMutation.mutate(deleteTarget.id) }} disabled={deleteMutation.isPending} className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2">
                <Trash2 size={14} />{deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}