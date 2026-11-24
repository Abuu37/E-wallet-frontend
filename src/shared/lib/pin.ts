/** Mirrors the server's PinPolicy so users get instant feedback. The server is still the authority. */
export const WEAK_PIN_MESSAGE = 'Too easy to guess. Avoid repeats and sequences like 1234.'

export function isWeakPin(pin: string): boolean {
  if (!/^[0-9]{4}$/.test(pin)) return false
  const d = [...pin].map(Number)
  const step = (delta: number) => d.every((v, i) => i === 0 || (d[i - 1] + delta) % 10 === v)
  const allSame = d.every((v) => v === d[0])
  const abab = d[0] === d[2] && d[1] === d[3]
  const aabb = d[0] === d[1] && d[2] === d[3]
  return allSame || step(1) || step(9) || abab || aabb
}
