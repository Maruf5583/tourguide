/**
 * ASP.NET + FluentValidation error response format:
 * {
 *   "errors": {
 *     "Name": ["Name is required"],
 *     "Latitude": ["Must be between -90 and 90"]
 *   }
 * }
 * অথবা simple:
 * { "message": "Something went wrong" }
 */
export function parseApiErrors(err) {
  const response = err?.response?.data

  if (!response) return { general: 'Network error. Check your connection.' }

  // FluentValidation / DataAnnotations style
  if (response.errors && typeof response.errors === 'object') {
    const mapped = {}
    Object.entries(response.errors).forEach(([key, msgs]) => {
      // ASP.NET returns PascalCase keys — convert to camelCase
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
      mapped[camelKey] = Array.isArray(msgs) ? msgs[0] : msgs
    })
    return mapped
  }

  // Single message
  if (response.message) return { general: response.message }
  if (response.title)   return { general: response.title }
  if (typeof response === 'string') return { general: response }

  return { general: 'Something went wrong. Please try again.' }
}