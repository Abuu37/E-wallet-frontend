import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'
import AuthLayout from '../components/AuthLayout'
import Button from '../../../components/ui/Button'
import EmailStep from '../components/forgot-pin/EmailStep'
import OtpStep from '../components/forgot-pin/OtpStep'
import SetPinStep from '../components/forgot-pin/SetPinStep'
import { stepLabel, stepOrder, type StepKey } from '../components/forgot-pin/types'

const slides = [ewalletImage, paymentImage, appScreenImage]

export default function ForgotPin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepKey>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')

  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <AuthLayout
      slides={slides}
      badgeText="Account recovery"
      heading="Get back into your wallet."
      subheading="Verify your email and set a new PIN to regain access."
      title="Reset your PIN"
      description="We'll walk you through resetting your PIN in a few steps."
      footer={
        <>
          Remembered your PIN?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {step !== 'success' && (
        <div className="mt-6 flex items-center gap-2">
          {stepOrder.map((item, index) => (
            <div key={item} className="flex flex-1 items-center gap-2">
              <span
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  index <= currentStepIndex ? 'bg-brand' : 'bg-line'
                }`}
              />
            </div>
          ))}
        </div>
      )}
      {step !== 'success' && (
        <p className="mt-2 text-xs font-medium text-muted">
          Step {currentStepIndex + 1} of {stepOrder.length}: {stepLabel[step]}
        </p>
      )}

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
      
        <AnimatePresence mode="wait">
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center py-4 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-positive/10 text-positive">
                <ShieldCheck size={24} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">PIN reset</h3>
              <p className="mt-2 text-sm text-muted">
                Your PIN has been updated. Log in with your new PIN to continue.
              </p>
              <Button type="button" className="mt-6 w-full" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </motion.div>
          )}

          {step === 'email' && (
            <EmailStep
              initialEmail={email}
              onSubmit={(value) => {
                setEmail(value)
                setStep('otp')
              }}
            />
          )}

          {step === 'otp' && (
            <OtpStep
              email={email}
              onVerified={(code) => {
                setOtp(code)
                setStep('pin')
              }}
              onBack={() => setStep('email')}
            />
          )}

          {step === 'pin' && (
            <SetPinStep
              email={email}
              otp={otp}
              onBack={() => setStep('otp')}
              onSuccess={() => setStep('success')}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}
