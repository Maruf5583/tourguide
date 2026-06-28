const variants = {
  green:  'bg-emerald-50 text-emerald-700',
  red:    'bg-red-50 text-red-700',
  amber:  'bg-amber-50 text-amber-700',
  blue:   'bg-blue-50 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-50 text-purple-700',
}

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span className={`badge ${variants[variant]}`}>{children}</span>
  )
}