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

/** The 9 national digits of a Tanzanian number typed as 0712…, 712…, or +255712…. */
export function tzDigits(input: string): string {
  return input.replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '')
}

/** A Tanzanian mobile number: 9 digits starting with 6 or 7. The server is still the authority. */
export function isTzMobile(input: string): boolean {
  return /^[67]\d{8}$/.test(tzDigits(input))
}

export function groupedTz(input: string): string {
  const d = tzDigits(input)
  return `+255 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`.trim()
}
