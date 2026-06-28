import { Star } from 'lucide-react'

export default function StarRating({ value, max = 5, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button key={star} type="button" onClick={() => onChange?.(star)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={size} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}