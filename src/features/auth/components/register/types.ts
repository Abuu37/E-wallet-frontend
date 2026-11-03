export type Step = 'details' | 'otp' | 'pin' | 'success'

export const stepOrder: Step[] = ['details', 'otp', 'pin']

export const stepLabel: Record<Step, string> = {
  details: 'Your details',
  otp: 'Verify phone',
  pin: 'Set PIN',
  success: 'Done',
}

export interface DetailsValues {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
}
