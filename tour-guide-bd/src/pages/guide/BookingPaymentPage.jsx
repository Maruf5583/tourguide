import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { formatBDT } from '../../utils/formatters'
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ── Inner form (must be inside <Elements>) ────────────────────
function CheckoutForm({ totalAmount, bookingId }) {
  const stripe   = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError]               = useState(null)
  const [success, setSuccess]           = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsProcessing(true)
    setError(null)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/${bookingId}/success`,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setIsProcessing(false)
    } else if (paymentIntent?.status === 'succeeded') {
      setSuccess(true)
      setTimeout(() => navigate(`/booking/${bookingId}/success`), 1500)
    } else {
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-10 space-y-3">
        <CheckCircle2 size={48} className="text-green-500 mx-auto" />
        <h2 className="text-xl font-black text-gray-900">Payment successful!</h2>
        <p className="text-sm text-gray-500">Redirecting to your booking…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 font-medium">Total amount</span>
        <span className="text-xl font-black text-primary-600">{formatBDT(totalAmount)}</span>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card'],
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full py-3.5 font-bold flex items-center justify-center gap-2"
      >
        {isProcessing
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
          : <><CreditCard size={16} /> Pay {formatBDT(totalAmount)}</>}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck size={13} className="text-green-500" />
        Secured by Stripe · Your card info is never stored
      </p>
    </form>
  )
}

// ── Page wrapper ──────────────────────────────────────────────
export default function BookingPaymentPage() {
  const { bookingId } = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()

  const clientSecret    = state?.clientSecret
  const totalAmount     = state?.totalAmount

  useEffect(() => {
    if (!clientSecret) navigate('/', { replace: true })
  }, [clientSecret])

  if (!clientSecret) return null

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary:    '#6366f1',
      colorBackground: '#ffffff',
      colorText:       '#111827',
      borderRadius:    '12px',
      fontFamily:      'Inter, system-ui, sans-serif',
    },
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">Complete payment</h1>
        <p className="text-sm text-gray-500 mt-1">Booking #{bookingId}</p>
      </div>

      <div className="card p-6">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <CheckoutForm totalAmount={totalAmount} bookingId={bookingId} />
        </Elements>
      </div>
    </div>
  )
}