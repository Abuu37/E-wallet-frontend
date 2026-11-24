/**
 * Money is a decimal string end to end ("1250000.00"); never do arithmetic on floats.
 * The API serialises BigDecimal as a JSON number, so `amountOf` converts it to a 2-dp decimal string
 * the moment it enters the app. TZS amounts stay far below 2^53, so this is lossless today; the
 * durable fix is for the server to serialise amounts as strings (noted in the session report).
 */
const DECIMAL = /^-?\d+(\.\d+)?$/

export function amountOf(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.00'
  return typeof value === 'number' ? value.toFixed(2) : normalizeAmount(value) || '0.00'
}

export function normalizeAmount(input: string): string {
  const cleaned = input.replace(/[,\s]/g, '')
  if (!DECIMAL.test(cleaned)) return ''
  const negative = cleaned.startsWith('-')
  const [whole, frac = ''] = cleaned.replace('-', '').split('.')
  const wholeTrimmed = whole.replace(/^0+(?=\d)/, '')
  const fracPadded = (frac + '00').slice(0, 2)
  return `${negative ? '-' : ''}${wholeTrimmed}.${fracPadded}`
}

/** "1250000.00" -> "1,250,000 TZS" (cents shown only when non-zero). */
export function formatTzs(amount: string | number | null | undefined, opts: { symbol?: boolean } = {}): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const normalized = amountOf(amount)
  const negative = normalized.startsWith('-')
  const [whole, frac] = normalized.replace('-', '').split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = frac === '00' ? grouped : `${grouped}.${frac}`
  return `${negative ? '-' : ''}${body}${opts.symbol === false ? '' : ' TZS'}`
}

/** Compact form for chart axes: 1.2M, 340K. */
export function formatCompact(amount: string | number | null | undefined): string {
  const n = Math.abs(Number(amountOf(amount)))
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}

/** Compares two decimal strings without floats. */
export function compareAmounts(a: string, b: string): number {
  const [aw, af] = normalizeAmount(a).split('.')
  const [bw, bf] = normalizeAmount(b).split('.')
  const aNeg = aw.startsWith('-')
  const bNeg = bw.startsWith('-')
  if (aNeg !== bNeg) return aNeg ? -1 : 1
  const av = BigInt(aw.replace('-', '') + af)
  const bv = BigInt(bw.replace('-', '') + bf)
  const cmp = av === bv ? 0 : av > bv ? 1 : -1
  return aNeg ? -cmp : cmp
}

/** a - b on decimal strings, exact (BigInt over hundredths). */
export function subtractAmounts(a: string, b: string): string {
  const toCents = (s: string) => {
    const n = normalizeAmount(s)
    const neg = n.startsWith('-')
    const [w, f] = n.replace('-', '').split('.')
    const v = BigInt(w + f)
    return neg ? -v : v
  }
  const diff = toCents(a) - toCents(b)
  const neg = diff < 0n
  const abs = (neg ? -diff : diff).toString().padStart(3, '0')
  return `${neg ? '-' : ''}${abs.slice(0, -2)}.${abs.slice(-2)}`
}
