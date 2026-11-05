export type StepKey = 'details' | 'otp' | 'pin'

export interface RegisterCustomerValues {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone: string
}

export const stepOrder: StepKey[] = ['details', 'otp', 'pin']

export const stepLabel: Record<StepKey, string> = {
  details: 'Your details',
  otp: 'Verify phone',
  pin: 'Set PIN',
}
