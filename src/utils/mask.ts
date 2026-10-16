// Keeps the country code and last 4 digits visible; the rest is masked for display security.
export function maskAccount(account: string) {
  const countryCode = account.match(/^\+\d+/)?.[0] ?? ''
  const digits = account.replace(/\D/g, '')
  return `${countryCode} **** **** ${digits.slice(-4)}`.trim()
}
