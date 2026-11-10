import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import { toast } from '../../../../lib/toast'
import Button from '../../../../components/ui/Button'

const OTP_LENGTH = 6
const RESEND_SECONDS = 300

interface OtpStepProps {
  email?: string
  onVerified: () => void
  onBack: () => void
}

interface ErrorResponse {
  message: string
}

export default function OtpStep({ email, onVerified, onBack }: OtpStepProps) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [hasError, setHasError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
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
    setHasError(false)
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    let response: Response
    try {
      response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      toast.error('Network Error', {
        description: 'Could not reach the server. Check your connection and try again.',
        duration: 3000,
      })
      return
    }

    try {
      const body: ErrorResponse = await response.json()

      if (!response.ok) {
        throw new Error(body.message ?? 'Could not resend code')
      }

      setOtp(Array(OTP_LENGTH).fill(''))
      setHasError(false)
      setResendCountdown(RESEND_SECONDS)
      otpRefs.current[0]?.focus()

      toast.success('Code Resent', {
        description: 'A new code has been sent to your email.',
        duration: 1500,
      })
    } catch (error) {
      toast.error('Resend Failed', {
        description: error instanceof Error ? error.message : 'Could not resend code',
        duration: 3000,
      })
    }
  }

  const handleVerify = async () => {
    if (otp.some((digit) => digit === '')) {
      setHasError(true)
      toast.error('Incomplete OTP', {
        description: 'Enter the full 6-digit otp',
        duration: 3000,
      })
      return
    }

    const code = otp.join('')
    setVerifying(true)

    let response: Response
    try {
      response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
    } catch {
      setHasError(true)
      toast.error('Network Error', {
        description: 'Could not reach the server. Check your connection and try again.',
        duration: 3000,
      })
      setVerifying(false)
      return
    }

    try {
      const body: ErrorResponse = await response.json()

      if (!response.ok) {
        throw new Error(body.message ?? 'Invalid code')
      }

      setHasError(false)
      onVerified()
    } catch (error) {
      setHasError(true)
      toast.error('Verification Failed', {
        description: error instanceof Error ? error.message : 'Invalid code',
        duration: 3000,
      })
    } finally {
      setVerifying(false)
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
          <Mail size={22} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Check your email</h3>
        <p className="mt-2 text-sm text-muted">
          Enter the 6-digit code we sent to <span className="font-semibold text-ink">{email}</span>
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
            className={`h-12 w-11 rounded-xl border bg-white text-center text-lg font-bold text-ink outline-none transition-colors ${
              hasError
                ? 'animate-otp-shake border-red-400 focus:border-red-500'
                : 'border-line focus:border-brand'
            }`}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-muted">
        {resendCountdown > 0 ? (
          <span>
            Resend code in {String(Math.floor(resendCountdown / 60)).padStart(2, '0')}:
            {String(resendCountdown % 60).padStart(2, '0')}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} />
            Resend code
          </button>
        )}
      </div>

      <Button type="button" className="mt-6 w-full" onClick={handleVerify} disabled={verifying} loading={verifying}>
        Verify
      </Button>
    </motion.div>
  )
}
