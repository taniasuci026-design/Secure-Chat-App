export function format(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
