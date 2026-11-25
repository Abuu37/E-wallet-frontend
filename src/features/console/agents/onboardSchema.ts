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

/** Checks the staff member's entries before the server sees them. The server stays the authority. */
export const onboardAgentSchema = yup.object({
  businessName: yup.string().default('').trim().required('Business name is required').max(150, 'Keep it under 150 characters'),
  tinNumber: yup.string().default('').trim().required('TIN is required').matches(/^\d{9}$/, 'TIN has 9 digits'),
  username: yup.string().default('').trim().required('Username is required')
    .matches(/^[A-Za-z0-9._-]{3,30}$/, '3 to 30 letters, numbers, dots, dashes or underscores'),
  firstName: yup.string().default('').trim().required('First name is required').matches(NAME, NAME_MSG),
  middleName: yup.string().default('').trim().test('name', NAME_MSG, (v) => !v || NAME.test(v)),
  lastName: yup.string().default('').trim().required('Last name is required').matches(NAME, NAME_MSG),
  gender: yup.string().default('').oneOf(['MALE', 'FEMALE', 'OTHER'], 'Select a gender'),
  dateOfBirth: yup.string().default('').required('Date of birth is required').test('age', (v, ctx) => {
    const a = ageOn(v ?? '')
    if (Number.isNaN(a) || a < 0) return ctx.createError({ message: 'Date of birth must be in the past' })
    return a >= 18 || ctx.createError({ message: 'The agent must be 18 or older' })
  }),
  phone: yup.string().default('').test('phone', (v, ctx) => {
    if (!tzDigits(v ?? '')) return ctx.createError({ message: 'Phone number is required' })
    return isTzMobile(v ?? '') || ctx.createError({ message: 'Use a Tanzanian mobile number: 9 digits starting with 6 or 7' })
  }),
  email: yup.string().default('').trim().required('Email is required').matches(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter a valid email, like name@example.com'),
  regionId: yup.string().default('').required('Select a region'),
  districtId: yup.string().default('').required('Select a district'),
})

export type OnboardAgentValues = yup.InferType<typeof onboardAgentSchema>
