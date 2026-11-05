export type StepKey = 'email' | 'otp' | 'pin' | 'success'

export const stepOrder: StepKey[] = ['email', 'otp', 'pin']

export const stepLabel: Record<StepKey, string> = {
  email: 'Your email',
  otp: 'Verify code',
  pin: 'Set new PIN',
  success: 'Done',
}
