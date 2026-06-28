import { format, formatDistanceToNow } from 'date-fns'

export const formatBDT = (n) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '৳—'
  return `৳${Number(n).toLocaleString('en-BD')}`
}

export const formatMinutes = (m) => {
  if (m === null || m === undefined || isNaN(Number(m))) return '—'
  const h   = Math.floor(Number(m) / 60)
  const min = Math.round(Number(m) % 60)
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

export const formatDate = (d) => {
  if (!d) return '—'
  try { return format(new Date(d), 'dd MMM yyyy') } catch { return '—' }
}

export const formatTime = (d) => {
  if (!d) return '—'
  try { return format(new Date(d), 'dd MMM yyyy, hh:mm a') } catch { return '—' }
}

export const timeAgo = (d) => {
  if (!d) return '—'
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }) } catch { return '—' }
}

export const formatKm = (n) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  return `${Number(n).toFixed(1)} km`
}