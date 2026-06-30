import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import { parseApiErrors } from '../../utils/apiErrors'
import { formatBDT } from '../../utils/formatters'
import { Calendar, Users, CreditCard, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

export default function BookGuidePage() {
  const { packageId } = useParams()
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    tourDate:      '',
    numberOfPeople: 1,
  })

  const validate = () => {
    const e = {}
    if (!form.tourDate) e.tourDate = 'Please select a tour date'
    else if (new Date(form.tourDate) <= new Date())
      e.tourDate = 'Tour date must be in the future'
    if (!form.numberOfPeople || form.numberOfPeople < 1)
      e.numberOfPeople = 'At least 1 person required'
    if (form.numberOfPeople > 50)
      e.numberOfPeople = 'Maximum 50 people allowed'
    return e
  }

  const bookMutation = useMutation({
    mutationFn: (data) => guideApi.createBooking(data),
    onSuccess: (res) => {
      toast.success('Booking created! Redirecting to payment…')
      // Stripe client secret আসবে — এখানে Stripe checkout এ redirect করা যাবে
      // res.data = { bookingId, stripeClientSecret, paymentIntentId, totalAmount }
      navigate(`/booking/${res.data.bookingId}/payment`, {
        state: {
          clientSecret:    res.data.stripeClientSecret,
          paymentIntentId: res.data.paymentIntentId,
          totalAmount:     res.data.totalAmount,
        }
      })
    },
    onError: (err) => {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) toast.error(apiErrors.general)
      else { setErrors(apiErrors); toast.error('Please fix the errors') }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    // exact match to CreateBookingCommand
    bookMutation.mutate({
      userId:          user?.id || '',
      userEmail:       user?.email || '',
      tourPackageId:   Number(packageId),
      tourDate:        new Date(form.tourDate).toISOString(),
      numberOfPeople:  Number(form.numberOfPeople),
    })
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">Book this tour</h1>
        <p className="text-sm text-gray-500 mt-1">Package #{packageId}</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar size={14} className="inline mr-1" />
            Tour date <span className="text-red-500">*</span>
          </label>
          <input type="date" value={form.tourDate}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            onChange={e => { setForm(p => ({ ...p, tourDate: e.target.value })); setErrors(p => ({ ...p, tourDate: null })) }}
            className={`input ${errors.tourDate ? 'border-red-400' : ''}`} />
          <FieldError msg={errors.tourDate} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users size={14} className="inline mr-1" />
            Number of people <span className="text-red-500">*</span>
          </label>
          <input type="number" min={1} max={50} value={form.numberOfPeople}
            onChange={e => { setForm(p => ({ ...p, numberOfPeople: e.target.value })); setErrors(p => ({ ...p, numberOfPeople: null })) }}
            className={`input ${errors.numberOfPeople ? 'border-red-400' : ''}`} />
          <FieldError msg={errors.numberOfPeople} />
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errors.general}
          </div>
        )}

        <button type="submit" disabled={bookMutation.isPending}
          className="btn-primary w-full py-3 font-bold flex items-center justify-center gap-2">
          {bookMutation.isPending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
            : <><CreditCard size={16} /> Confirm & pay</>}
        </button>

        <p className="text-xs text-center text-gray-400">
          Payment processed securely via Stripe
        </p>
      </form>
    </div>
  )
}