import * as yup from 'yup'
import { isTzMobile, tzDigits } from '../../../shared/lib/phone'

const NAME = /^[\p{L}\s'-]+$/u
const NAME_MSG = 'Letters, spaces, hyphens and apostrophes only'

function ageOn(dobIso: string): number {
  const d = new Date(dobIso)
  if (Number.isNaN(d.getTime())) return NaN
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

/** Checks the staff member's entries before the server sees them (messages follow the S09e design). The server stays the authority. */
export const onboardAgentSchema = yup.object({
  businessName: yup.string().default('').trim().required('Required').max(150, 'Keep it under 150 characters'),
  tinNumber: yup.string().default('').trim().required('Required').matches(/^\d{3}-?\d{3}-?\d{3}$/, 'TIN is 9 digits, e.g. 123-456-789'),
  firstName: yup.string().default('').trim().required('Required').matches(NAME, NAME_MSG),
  middleName: yup.string().default('').trim().test('name', NAME_MSG, (v) => !v || NAME.test(v)),
  lastName: yup.string().default('').trim().required('Required').matches(NAME, NAME_MSG),
  gender: yup.string().default('').required('Required').oneOf(['FEMALE', 'MALE'], 'Required'),
  dateOfBirth: yup.string().default('').required('Required').test('age', (v, ctx) => {
    const a = ageOn(v ?? '')
    if (Number.isNaN(a) || a < 0) return ctx.createError({ message: 'Date of birth must be in the past' })
    return a >= 18 || ctx.createError({ message: 'The owner must be 18 or older' })
  }),
  phone: yup.string().default('').test('phone', (v, ctx) => {
    if (!tzDigits(v ?? '')) return ctx.createError({ message: 'Required' })
    return isTzMobile(v ?? '') || ctx.createError({ message: 'Use a Tanzanian mobile number, e.g. 0713 880 412' })
  }),
  email: yup.string().default('').trim().required('Required').matches(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter a valid email'),
  regionId: yup.string().default('').required('Required'),
  districtId: yup.string().default('').required('Required'),
})

export type OnboardAgentValues = yup.InferType<typeof onboardAgentSchema>

/** A technical login name staff never type: the business name plus random digits. */
export function makeAgentUsername(businessName: string): string {
  const base = businessName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'agent'
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

/** "123456789" or "123-456-789" -> "123-456-789" */
export function formatTin(input: string): string {
  const d = input.replace(/\D/g, '')
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}`
}
