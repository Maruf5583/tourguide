const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'https://localhost:44389'

/**
 * Backend থেকে আসা photo URL local relative path হলে
 * full backend URL এ convert করে। ইতিমধ্যে full URL (http/https) হলে as-is রাখে।
 */
export function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}