import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw, Smartphone } from 'lucide-react'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import Button from '../../../../components/ui/Button'
import { resendOtp, verifyOtp as verifyOtpRequest } from '../../api/onboarding'
import { ApiRequestError } from '../../../../lib/api/client'
import { errorClass } from './shared'

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

interface OtpStepProps {
  email?: string
  phone?: string
  onVerified: () => void
  onBack: () => void
}

export default function OtpStep({ email, phone, onVerified, onBack }: OtpStepProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    setOtp((prev) => {
      const next = [...prev]
      next[index] = value.slice(-1)
      return next
    })
    setOtpError('')
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (!email || isResending) return
    setIsResending(true)
    setOtpError('')
    try {
      await resendOtp(email)
      setOtp(Array(OTP_LENGTH).fill(''))
      setResendCountdown(RESEND_SECONDS)
      otpRefs.current[0]?.focus()
    } catch (error) {
      setOtpError(error instanceof ApiRequestError ? error.message : 'Could not resend the code.')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async () => {
    if (otp.some((digit) => digit === '')) {
      setOtpError('Enter the full 6-digit code')
      return
    }
    if (!email) return
    setIsVerifying(true)
    setOtpError('')
    try {
      await verifyOtpRequest(email, otp.join(''))
      onVerified()
    } catch (error) {
      setOtpError(error instanceof ApiRequestError ? error.message : 'Verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
      >
        <ArrowLeft
          size={14}
          className="transition-transform duration-200 group-hover:-translate-x-1"
        />
        Back
      </button>

      <div className="mt-4 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Smartphone size={22} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Verify your phone number</h3>
        <p className="mt-2 text-sm text-muted">
          Enter the 6-digit code we sent to{' '}
          <span className="font-semibold text-ink">{phone ? formatPhoneNumberIntl(phone) : ''}</span>
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              otpRefs.current[index] = node
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleOtpChange(index, event.target.value)}
            onKeyDown={(event) => handleOtpKeyDown(index, event)}
            className={`h-12 w-11 rounded-xl border text-center text-lg font-bold text-ink outline-none transition-colors focus:bg-white ${
              otpError
                ? 'border-red-400 bg-surface focus:border-red-500'
                : 'border-transparent bg-surface focus:border-brand'
            }`}
          />
        ))}
      </div>
      {otpError && <p className={`${errorClass} text-center`}>{otpError}</p>}

      <div className="mt-4 text-center text-sm text-muted">
        {resendCountdown > 0 ? (
          <span>Resend code in 00:{String(resendCountdown).padStart(2, '0')}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} />
            {isResending ? 'Resending…' : 'Resend code'}
          </button>
        )}
      </div>

      <Button type="button" className="mt-6 w-full" onClick={handleVerify} disabled={isVerifying}>
        {isVerifying ? 'Verifying…' : 'Verify & Continue'}
      </Button>
    </motion.div>
  )
}
