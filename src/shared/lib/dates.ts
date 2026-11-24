const TZ = 'Africa/Dar_es_Salaam'

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const dateOnly = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })
const timeOnly = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatDateTime = (v: string | null | undefined) => { const d = parse(v); return d ? dateTime.format(d) : '—' }
export const formatDate = (v: string | null | undefined) => { const d = parse(v); return d ? dateOnly.format(d) : '—' }
export const formatTime = (v: string | null | undefined) => { const d = parse(v); return d ? timeOnly.format(d) : '—' }

/** yyyy-MM-dd for "today" in Dar es Salaam, used for API date filters. */
export function todayInDar(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}
