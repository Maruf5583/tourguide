import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Star, ChevronLeft, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingApi } from '../../api/booking.api'
import { useAuthStore } from '../../store/auth.store'
import client from '../../api/client'
import LoadingSpinner from '../../components/common/LoadingSpinner'

var RATINGS = [
  { key: 'punctualityRating',   label: 'Punctuality',   desc: 'Did the guide arrive on time?' },
  { key: 'knowledgeRating',     label: 'Knowledge',     desc: 'How knowledgeable was the guide?' },
  { key: 'communicationRating', label: 'Communication', desc: 'How well did the guide communicate?' },
  { key: 'safetyRating',        label: 'Safety',        desc: 'Did you feel safe throughout the tour?' },
  { key: 'valueRating',         label: 'Value',         desc: 'Was it worth the price?' },
]

function StarPicker(props) {
  var value = props.value
  var onChange = props.onChange
  var name = props.name
  var [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(function(i) {
        var filled = i <= (hovered || value)
        var cls = filled
          ? 'text-amber-400 fill-amber-400 cursor-pointer transition-transform hover:scale-110'
          : 'text-gray-200 fill-gray-200 cursor-pointer transition-transform hover:scale-110'
        return (
          <Star
            key={i}
            size={28}
            className={cls}
            onMouseEnter={function() { setHovered(i) }}
            onMouseLeave={function() { setHovered(0) }}
            onClick={function() { onChange(name, i) }}
          />
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-amber-500">
          {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent'}
        </span>
      )}
    </div>
  )
}

function OverallStars(props) {
  var value = props.value
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map(function(i) {
        var cls = i <= Math.round(value)
          ? 'text-amber-400 fill-amber-400'
          : 'text-gray-200 fill-gray-200'
        return <Star key={i} size={32} className={cls} />
      })}
    </div>
  )
}

export default function ReviewPage() {
  var params = useParams()
  var bookingId = Number(params.bookingId)
  var navigate = useNavigate()
  var user = useAuthStore(function(s) { return s.user })

  var [ratings, setRatings] = useState({
    punctualityRating:   0,
    knowledgeRating:     0,
    communicationRating: 0,
    safetyRating:        0,
    valueRating:         0,
  })
  var [comment, setComment] = useState('')
  var [submitted, setSubmitted] = useState(false)

  var queryResult = useQuery({
    queryKey: ['my-booking', bookingId],
    queryFn: function() {
      return bookingApi.getMyBookingById(bookingId).then(function(r) { return r.data })
    },
    enabled: !!bookingId,
  })

  var booking = queryResult.data
  var isLoading = queryResult.isLoading

  var overallAvg = Object.values(ratings).some(function(v) { return v > 0 })
    ? Math.round((ratings.punctualityRating + ratings.knowledgeRating + ratings.communicationRating + ratings.safetyRating + ratings.valueRating) / 5)
    : 0

  var mutation = useMutation({
    mutationFn: function(payload) {
      return client.post('/guide/bookings/' + bookingId + '/review', payload)
    },
    onSuccess: function() {
      setSubmitted(true)
    },
    onError: function(err) {
      var msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Failed to submit review'
      toast.error(msg)
    },
  })

  function handleRatingChange(key, value) {
    setRatings(function(prev) {
      var next = Object.assign({}, prev)
      next[key] = value
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    var allFilled = Object.values(ratings).every(function(v) { return v > 0 })
    if (!allFilled) {
      toast.error('Please rate all categories')
      return
    }
   mutation.mutate({
  bookingId: bookingId,
  punctualityRating:   ratings.punctualityRating,
  knowledgeRating:     ratings.knowledgeRating,
  communicationRating: ratings.communicationRating,
  safetyRating:        ratings.safetyRating,
  valueRating:         ratings.valueRating,
  comment: comment || null,
})
  }

  if (isLoading) return <LoadingSpinner center />

  if (!booking) {
    return (
      <div className="text-center py-20 text-gray-400">Booking not found.</div>
    )
  }

  if (booking.hasReviewed || submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {submitted ? 'Review Submitted!' : 'Already Reviewed'}
        </h2>
        <p className="text-gray-500 mb-6">
          {submitted
            ? 'Thank you for your feedback. It helps other travelers find great guides.'
            : 'You have already submitted a review for this booking.'}
        </p>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Back to My Bookings
        </Link>
      </div>
    )
  }

  if (!booking.canReview) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">This booking is not eligible for review yet.</p>
        <Link to="/my-bookings" className="text-primary-600 hover:underline text-sm">
          Back to My Bookings
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/my-bookings"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> My Bookings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Rate Your Experience</h1>
      <p className="text-sm text-gray-400 mb-6">Share your feedback about this tour</p>

      {/* Booking summary */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center gap-4">
        <img
          src={booking.guidePhotoUrl || '/default-avatar.png'}
          alt={booking.guideName}
          className="w-14 h-14 rounded-xl object-cover shrink-0"
        />
        <div>
          <p className="font-semibold text-gray-900">{booking.guideName}</p>
          <p className="text-sm text-gray-500">{booking.packageTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(booking.tourDate).toLocaleDateString('en-BD', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Overall preview */}
      {overallAvg > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 mb-6 text-center">
          <p className="text-xs text-gray-400 mb-2">Overall Rating</p>
          <OverallStars value={overallAvg} />
          <p className="text-2xl font-bold text-amber-500 mt-1">{overallAvg}.0 / 5</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating categories */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
          {RATINGS.map(function(item) {
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <StarPicker
                  name={item.key}
                  value={ratings[item.key]}
                  onChange={handleRatingChange}
                />
              </div>
            )
          })}
        </div>

        {/* Comment */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Write a Review <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={function(e) { setComment(e.target.value) }}
            maxLength={500}
            rows={4}
            placeholder="Share your experience with other travelers..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
          <p className="text-xs text-gray-300 text-right mt-1">{comment.length}/500</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={15} />
          {mutation.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}