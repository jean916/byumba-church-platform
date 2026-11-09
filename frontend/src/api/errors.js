// Turns a failed API call into a message a person can act on, instead of a
// vague "something went wrong".
export function explainError(err) {
  if (!err.response) return 'Cannot reach the server. Is the backend running?'
  const { status, data } = err.response
  if (status === 401) return 'Your login has expired. Log out, log in again, then retry.'
  if (status === 403) return (data && data.detail) || 'You are not allowed to do this.'
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
      .join(' | ')
  }
  return `Server error (${status}).`
}
