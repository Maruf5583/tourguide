import { useState } from 'react'
import { X, Users, Calendar, CreditCard, Loader, MapPin } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { bookingApi } from '../../api/booking.api'
import { useAuthStore } from '../../store/auth.store'
import { useNavigate } from 'react-router-dom'

var stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

var inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

var cardStyle = {
  style: {
    base: {
      fontSize: '14px',
      color: '#374151',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

// ── Payment Form (inside Elements) ──────────────────────
function PaymentForm(props) {
  var pkg = props.pkg
  var bookingData = props.bookingData
  var onClose = props.onClose
  var onSuccess = props.onSuccess

  var stripe = useStripe()
  var elements = useElements()
  var user = useAuthStore(function(s) { return s.user })
  var navigate = useNavigate()

  var [step, setStep] = useState('form') // 'form' | 'payment'
  var [form, setForm] = useState({
    tourDate: '',
    numberOfPeople: 1,
  })
  var [bookingResult, setBookingResult] = useState(null)
  var [paying, setPaying] = useState(false)

  var totalAmount = bookingResult
    ? bookingResult.totalAmount
    : pkg.pricePerPerson * form.numberOfPeople

  var createMutation = useMutation({
    mutationFn: function(payload) { return bookingApi.create(payload) },
    onSuccess: function(res) {
      setBookingResult(res.data)
      setStep('payment')
    },
    onError: function(err) {
      var msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Booking failed'
      toast.error(msg)
    },
  })

  function handleBook(e) {
    e.preventDefault()
    if (!form.tourDate) return toast.error('Please select a tour date')
    createMutation.mutate({
      userId: user.id,
      userEmail: user.email,
      tourPackageId: pkg.id,
      tourDate: form.tourDate,
      numberOfPeople: Number(form.numberOfPeople),
    })
  }

  async function handlePay(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!bookingResult) return

    setPaying(true)
    try {
      var result = await stripe.confirmCardPayment(bookingResult.stripeClientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email: user.email,
            name: user.fullName || user.email,
          },
        },
      })

      if (result.error) {
        toast.error(result.error.message || 'Payment failed')
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Webhook local এ কাজ করে না, তাই সরাসরি backend কে confirm করতে বলা হচ্ছে
        try {
          await bookingApi.confirmPayment(bookingResult.bookingId, {
            paymentIntentId: result.paymentIntent.id,
            chargeId: result.paymentIntent.latest_charge || '',
          })
        } catch (confirmErr) {
          console.error('Confirm payment call failed:', confirmErr)
          toast.error('Payment succeeded but confirmation failed. Contact support.')
        }

        toast.success('Payment successful!')
        onClose()
        navigate('/my-bookings?success=' + bookingResult.bookingId)
      }
    } catch (err) {
      toast.error('Payment error. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  // ── Step 1: Booking Form ─────────────────────────────
  if (step === 'form') {
    var availableDates = pkg.upcomingAvailabilities
      ? pkg.upcomingAvailabilities.filter(function(a) { return a.isAvailable })
      : []

    return (
      <div className="space-y-4">
        {/* Package summary */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-900">{pkg.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {'৳' + Number(pkg.pricePerPerson).toLocaleString() + ' per person · Max ' + pkg.maxPeople + ' people'}
          </p>
          {pkg.meetingPoint && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <MapPin size={11} />{pkg.meetingPoint}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tour Date <span className="text-red-500">*</span>
          </label>
          {availableDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableDates.map(function(a) {
                var isSelected = form.tourDate === a.date
                var btnCls = isSelected
                  ? 'px-3 py-1.5 rounded-xl text-sm font-medium border-2 border-primary-500 bg-primary-50 text-primary-700'
                  : 'px-3 py-1.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50 transition-colors'
                return (
                  <button
                    key={a.date}
                    type="button"
                    onClick={function() { setForm(function(p) { return Object.assign({}, p, { tourDate: a.date }) }) }}
                    className={btnCls}
                  >
                    {new Date(a.date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}
                    <span className="ml-1 text-xs opacity-60">{a.remainingSlots} left</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <input
              type="date"
              value={form.tourDate}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { tourDate: e.target.value }) }) }}
              className={inputCls}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of People <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={function() { setForm(function(p) { return Object.assign({}, p, { numberOfPeople: Math.max(1, p.numberOfPeople - 1) }) }) }}
              className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-medium transition-colors"
            >
              -
            </button>
            <span className="text-lg font-semibold text-gray-900 w-8 text-center">{form.numberOfPeople}</span>
            <button
              type="button"
              onClick={function() { setForm(function(p) { return Object.assign({}, p, { numberOfPeople: Math.min(pkg.maxPeople, p.numberOfPeople + 1) }) }) }}
              className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-medium transition-colors"
            >
              +
            </button>
            <span className="text-sm text-gray-400">max {pkg.maxPeople}</span>
          </div>
        </div>

        {/* Total */}
        <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="text-xl font-bold text-primary-600">
            {'৳' + Number(totalAmount).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBook}
            disabled={createMutation.isPending || !form.tourDate}
            className="flex-1 bg-primary-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {createMutation.isPending
              ? <><Loader size={15} className="animate-spin" /> Processing...</>
              : <><CreditCard size={15} /> Proceed to Pay</>}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Stripe Card Payment ──────────────────────
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-800 mb-1">Booking Created!</p>
        <p className="text-xs text-green-600">
          Booking ID: #{bookingResult.bookingId} · Complete payment to confirm.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total to Pay</span>
        <span className="text-xl font-bold text-primary-600">
          {'৳' + Number(bookingResult.totalAmount).toLocaleString()}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary-300 transition-all">
          <CardElement options={cardStyle} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <CreditCard size={11} /> Secured by Stripe. We never store your card details.
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={function() { setStep('form') }}
          disabled={paying}
          className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={paying || !stripe}
          className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {paying
            ? <><Loader size={15} className="animate-spin" /> Paying...</>
            : <><CreditCard size={15} /> Pay Now</>}
        </button>
      </div>
    </div>
  )
}

// ── Main Modal ───────────────────────────────────────────
export default function BookingModal(props) {
  var isOpen = props.isOpen
  var onClose = props.onClose
  var pkg = props.pkg

  if (!isOpen || !pkg) return null

  var overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '16px',
  }

  return (
    <div style={overlayStyle} onClick={function(e) { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Book Package</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <Elements stripe={stripePromise}>
            <PaymentForm pkg={pkg} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  )
}