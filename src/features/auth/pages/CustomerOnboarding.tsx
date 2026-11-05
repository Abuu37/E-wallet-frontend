import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Swal from 'sweetalert2'
import type { Country } from 'react-phone-number-input'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'
import AuthLayout from '../components/AuthLayout'
import DetailsStep from '../components/register/DetailsStep'
import OtpStep from '../components/register/OtpStep'
import PinStep from '../components/register/PinStep'
import {
  stepLabel,
  stepOrder,
  type StepKey,
  type RegisterCustomerValues,
} from '../components/register/types'

const slides = [paymentImage, appScreenImage, ewalletImage]

let hasCheckedReload = false

export default function CustomerOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepKey>('details')
  const [details, setDetails] = useState<RegisterCustomerValues | null>(null)
  const [country, setCountry] = useState<Country>('TZ')

  useEffect(() => {
    if (hasCheckedReload) return
    hasCheckedReload = true

    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (entry?.type === 'reload' && window.location.pathname === '/register') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleDetailsSubmit = (values: RegisterCustomerValues) => {
    setDetails(values)
    setStep('otp')
  }

  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <AuthLayout
      slides={slides}
      badgeText="Get started in minutes"
      heading="Open your wallet in minutes."
      subheading="Register, verify your identity, and get a virtual card issued instantly."
      title="Create your account"
      description="Register in minutes and we'll guide you through getting your card."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
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
      <p className="mt-2 text-xs font-medium text-muted">
        Step {currentStepIndex + 1} of {stepOrder.length}: {stepLabel[step]}
      </p>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <DetailsStep
              initialValues={details}
              country={country}
              onCountryChange={setCountry}
              onSubmit={handleDetailsSubmit}
            />
          )}

          {step === 'otp' && (
            <OtpStep
              email={details?.email}
              onVerified={() => setStep('pin')}
              onBack={() => setStep('details')}
            />
          )}

          {step === 'pin' && (
            <PinStep
              email={details?.email ?? ''}
              onBack={() => setStep('otp')}
              onSuccess={() => {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'success',
                  title: "You're registered",
                  text: "We'll reach out with next steps to get your WalletPesa card.",
                  showConfirmButton: false,
                  timer: 2000,
                })
                navigate('/login')
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}
