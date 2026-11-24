// Keeps the country code and last 4 digits visible; the rest is masked for display security.
export function maskAccount(account: string) {
  const countryCode = account.match(/^\+\d+/)?.[0] ?? ''
  const digits = account.replace(/\D/g, '')
  return `${countryCode} **** **** ${digits.slice(-4)}`.trim()
}

// Agent/float codes (e.g. "FA-384021", "012323715213") aren't phone numbers, so only mask
// values that actually look like one (a "+"-prefixed international number) — masking a
// float code would just mangle it into something unrecognizable.
export function displayAccount(account: string) {
  return account.startsWith('+') ? maskAccount(account) : account
}
