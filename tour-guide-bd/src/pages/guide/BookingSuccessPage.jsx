import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Home, Calendar } from 'lucide-react'

export default function BookingSuccessPage() {
  const { bookingId } = useParams()

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center space-y-5">
      <CheckCircle2 size={64} className="text-green-500 mx-auto" />
      <div>
        <h1 className="text-2xl font-black text-gray-900">Booking confirmed!</h1>
        <p className="text-gray-500 text-sm mt-2">
          Your booking <span className="font-semibold text-gray-700">#{bookingId}</span> has been placed
          successfully. You'll receive a confirmation shortly.
        </p>
      </div>
      <div className="flex gap-3 justify-center pt-2">
        <Link to="/" className="btn-secondary flex items-center gap-2 px-5">
          <Home size={15} /> Home
        </Link>
        <Link to="/profile" className="btn-primary flex items-center gap-2 px-5">
          <Calendar size={15} /> My bookings
        </Link>
      </div>
    </div>
  )
}