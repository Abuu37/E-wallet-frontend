import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from '../../../../lib/toast'
import Button from '../../../../components/ui/Button'
import { getFieldClass, errorClass, RequiredMark } from './shared'

const PIN_LENGTH = 4

interface PinStepProps {
  email: string
  onBack: () => void
  onSuccess: () => void
}

interface ErrorResponse {
  message: string
}

export default function PinStep({ email, onBack, onSuccess }: PinStepProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [pinError, setPinError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreateAccount = async () => {
    if (pin.length !== PIN_LENGTH) {
      setPinError(`PIN must be ${PIN_LENGTH} digits`)
      return
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match')
      return
    }

    setSubmitting(true)

    let response: Response
    try {
      response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/set-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, confirmPin }),
      })
    } catch {
      setPinError('Could not reach the server. Check your connection and try again.')
      toast.error('Network Error', {
        description: 'Could not reach the server. Check your connection and try again.',
        duration: 3000,
      })
      setSubmitting(false)
      return
    }

    try {
      const body: ErrorResponse = await response.json()

      if (!response.ok) {
        throw new Error(body.message ?? 'Could not create account')
      }

      setPinError('')
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create account'
      setPinError(message)
      toast.error('Account Creation Failed', { description: message, duration: 3000 })
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <motion.div
      key="pin"
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
          <Lock size={22} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Set your PIN</h3>
        <p className="mt-2 text-sm text-muted">
          Create a {PIN_LENGTH}-digit PIN to secure your wallet.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="pin" className="text-sm font-medium text-ink">
            PIN <RequiredMark />
          </label>
          <div className="relative mt-2">
            <Lock
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand"
            />
            <span className="pointer-events-none absolute left-9 top-1/2 h-5 w-px -translate-y-1/2 bg-line" />
            <input
              id="pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(event) => {
                if (/^\d*$/.test(event.target.value)) setPin(event.target.value)
                setPinError('')
              }}
              className={`${getFieldClass(Boolean(pinError))} pr-11 tracking-[0.5em]`}
              placeholder="••••"
            />
            <button
              type="button"
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPin" className="text-sm font-medium text-ink">
            Confirm PIN <RequiredMark />
          </label>
          <div className="relative mt-2">
            <Lock
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand"
            />
            <span className="pointer-events-none absolute left-9 top-1/2 h-5 w-px -translate-y-1/2 bg-line" />
            <input
              id="confirmPin"
              type={showConfirmPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={confirmPin}
              onChange={(event) => {
                if (/^\d*$/.test(event.target.value)) setConfirmPin(event.target.value)
                setPinError('')
              }}
              className={`${getFieldClass(Boolean(pinError))} pr-11 tracking-[0.5em]`}
              placeholder="••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPin((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
              aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {pinError && <p className={errorClass}>{pinError}</p>}
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleCreateAccount}
          disabled={submitting}
          loading={submitting}
        >
          Create Account
        </Button>
      </div>
    </motion.div>
  )
}
