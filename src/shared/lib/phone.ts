/** Display/mask helpers only; the server normalizes with libphonenumber and is the source of truth. */
export function toE164Tz(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('255')) return `+${digits}`
  if (digits.startsWith('0')) return `+255${digits.slice(1)}`
  return `+255${digits}`
}

/** "+255712345678" -> "+255 712 345 678" */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '—'
  const m = e164.match(/^\+255(\d{3})(\d{3})(\d{3})$/)
  return m ? `+255 ${m[1]} ${m[2]} ${m[3]}` : e164
}

/** "+255712345678" -> "+255 ••• ••• 678" */
export function maskPhone(e164: string | null | undefined): string {
  if (!e164) return '—'
  const digits = e164.replace(/\D/g, '')
  return `+${digits.slice(0, 3)} ••• ••• ${digits.slice(-3)}`
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}•••@${domain}`
}

export function maskNida(nida: string | null | undefined): string {
  if (!nida) return '—'
  const digits = nida.replace(/\D/g, '')
  return `•••• •••• ${digits.slice(-4)}`
}
