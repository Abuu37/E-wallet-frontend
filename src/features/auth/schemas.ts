import * as yup from 'yup'
import { isWeakPin } from '../../shared/lib/pin'
import { isTzMobile, tzDigits } from '../../shared/lib/phone'

export const digitsOf = (v: string) => v.replace(/\D/g, '')

const NAME = /^[\p{L}\s'-]+$/u
const NAME_MSG = 'Letters, spaces, hyphens and apostrophes only'
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const phone = yup.string().default('')
  .test('phone', (v, ctx) => {
    if (!tzDigits(v ?? '')) return ctx.createError({ message: 'Enter your phone number' })
    return isTzMobile(v ?? '') || ctx.createError({ message: 'Use a Tanzanian mobile number: 9 digits starting with 6 or 7' })
  })

export const email = yup.string().default('').trim()
  .test('email', (v, ctx) => {
    if (!v) return ctx.createError({ message: 'Enter your email' })
    return EMAIL.test(v) || ctx.createError({ message: 'Enter a valid email, like name@example.com' })
  })

export const code = yup.string().default('').matches(/^\d{6}$/, 'Enter all 6 digits')

// ---- sign in ---------------------------------------------------------------------------------

export const signInSchema = yup.object({
  phone,
  pin: yup.string().default('').required('Enter your PIN').length(4, 'Your PIN has 4 digits'),
})

// ---- registration ----------------------------------------------------------------------------

export const registerPhoneSchema = yup.object({
  phone,
  terms: yup.boolean().default(false).oneOf([true], 'Please agree to continue'),
})

function ageOn(dobIso: string): number {
  const d = new Date(dobIso)
  if (Number.isNaN(d.getTime())) return NaN
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

export const detailsSchema = yup.object({
  first: yup.string().default('').trim().required('Required').matches(NAME, NAME_MSG),
  middle: yup.string().default('').trim().test('name', NAME_MSG, (v) => !v || NAME.test(v)),
  last: yup.string().default('').trim().required('Required').matches(NAME, NAME_MSG),
  nida: yup.string().default('').trim().required('Required')
    .test('nida', (v, ctx) => digitsOf(v ?? '').length === 20 || ctx.createError({ message: `NIDA number has 20 digits (${digitsOf(v ?? '').length} entered)` })),
  dob: yup.string().default('').required('Required')
    .test('dob', (v, ctx) => {
      const a = ageOn(v ?? '')
      if (Number.isNaN(a) || a < 0) return ctx.createError({ message: 'Date of birth must be in the past' })
      return a >= 18 || ctx.createError({ message: 'You must be 18 or older to open a wallet' })
    }),
  email: yup.string().default('').trim().required('Required').matches(EMAIL, 'Enter a valid email, like name@example.com'),
  address: yup.string().default('').trim().required('Required').max(255, 'Keep it under 255 characters'),
})
export type DetailsValues = yup.InferType<typeof detailsSchema>

export const codeSchema = yup.object({ code })

// ---- PIN -------------------------------------------------------------------------------------

/** Live checklist for a new PIN. The birth rule only applies when a date of birth is known. */
export function pinRules(pin: string, dob?: string): { text: string; ok: boolean }[] {
  const full = /^[0-9]{4}$/.test(pin)
  const d = [...pin].map(Number)
  const same = full && d.every((n) => n === d[0])
  const seq = full && ('0123456789'.includes(pin) || '9876543210'.includes(pin))
  const pairs = full && ((d[0] === d[2] && d[1] === d[3]) || (d[0] === d[1] && d[2] === d[3]))
  const rules = [
    { text: 'Exactly 4 digits', ok: full },
    { text: 'Not one digit repeated (like 0000)', ok: full && !same },
    { text: 'Not a sequence (like 1234 or 4321)', ok: full && !seq },
    { text: 'Not a repeating pair (like 1212 or 1122)', ok: full && !pairs },
  ]
  if (dob !== undefined) {
    const b = digitsOf(dob)
    const birth = full && b.length === 8 && (b.slice(0, 4) === pin || b.slice(4, 8) === pin || b.slice(6, 8) + b.slice(4, 6) === pin)
    rules.push({ text: 'Not your birth year or birthday', ok: full && !birth })
  }
  return rules
}

/** New PIN plus confirmation. Pass the date of birth to also reject birthdays. */
export const newPinSchema = (dob?: string) => yup.object({
  pin: yup.string().default('')
    .test('strong', 'Choose a PIN that passes every rule above.', (v) => pinRules(v ?? '', dob).every((r) => r.ok) && !isWeakPin(v ?? '')),
  pin2: yup.string().default('').test('match', 'The two PINs don’t match.', (v, ctx) => v === ctx.parent.pin),
})

// ---- forgot PIN: phone + last 4 NIDA digits ----------------------------------------------------

export const forgotSchema = yup.object({
  phone,
  nidaLast4: yup.string().default('').required('Enter the last 4 digits').matches(/^\d{4}$/, 'Enter the last 4 digits'),
})
