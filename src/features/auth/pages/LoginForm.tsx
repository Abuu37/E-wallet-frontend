import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'
import { Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../../../components/ui/Button'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../../../components/context/AuthContext'
import type { Role } from '../types'

import PhoneInput, { isValidPhoneNumber, type Country } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const slides = [ewalletImage, paymentImage, appScreenImage]
const PIN_LENGTH = 4

interface LoginValues {
  phone: string
  pin: string
}

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    roles: Role[]
  }
}

interface LoginErrorResponse {
  message: string
}

const getPinFieldClass = (hasError: boolean) =>
  `w-full rounded-full border py-2.5 pl-11 pr-11 text-sm tracking-[0.5em] outline-none transition-colors focus:bg-white ${
    hasError
      ? 'border-red-400 bg-surface focus:border-red-500'
      : 'border-transparent bg-surface focus:border-brand'
  }`
const errorClass = 'mt-2 text-xs font-medium text-red-600'

const loginSchema = Yup.object({
  phone: Yup.string()
    .required('Phone number is required')
    .test('is-valid-phone', 'Enter a valid phone number', (value) =>
      Boolean(value && isValidPhoneNumber(value)),
    ),
  pin: Yup.string()
    .matches(/^\d{4}$/, `PIN must be ${PIN_LENGTH} digits`)
    .required('PIN is required'),
})

export default function LoginForm() {
  const [showPin, setShowPin] = useState(false)
  const [country, setCountry] = useState<Country>('TZ')
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout
      slides={slides}
      badgeText="Trusted by 250K+ users"
      heading="One wallet for every payment."
      subheading="Log in to send money, pay bills, and manage your card from anywhere."
      title="Welcome back"
      description="Log in to manage your WalletPesa account and card."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Register
          </Link>
        </>
      }
    >
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
        <Formik<LoginValues>

          initialValues={{ phone: '', pin: '' }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: values.phone.replace(/^\+/, ''),
                  pin: values.pin,
                }),
              })

              const body: LoginResponse | LoginErrorResponse = await response.json()

              if (!response.ok) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'error',
                  title: 'Login Failed',
                  text: 'message' in body ? body.message : 'Login failed',
                  showConfirmButton: false,
                })
                return
              }

              const { accessToken, refreshToken, roles } = (body as LoginResponse).data
              login({ accessToken, refreshToken, roles })

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Login Successful',
                showConfirmButton: false,
                timer: 1500,
              })

              if (roles.includes('CUSTOMER')) {
                navigate('/account')
              } else if (roles.includes('ADMIN') || roles.includes('CASHIER')) {
                navigate('/dashboard')
              } else {
                navigate('/unauthorized')
              }

            } catch (error) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Login Failed',
                text: error instanceof Error ? error.message : 'Login failed',
                showConfirmButton: false,
              })
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting, errors, touched, values, setFieldValue, setFieldTouched }) => (
            <Form className="space-y-5">
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-ink">
                  Phone number
                </label>
                <div className="mt-2">
                  <PhoneInput
                    id="phone"
                    international
                    defaultCountry={country}
                    value={values.phone}
                    onChange={(value) => setFieldValue('phone', value ?? '')}
                    onCountryChange={(value) => {
                      if (value) setCountry(value)
                    }}
                    onBlur={() => setFieldTouched('phone', true)}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    className={`phone-input ${touched.phone && errors.phone ? 'PhoneInput--error' : ''}`}
                  />
                </div>
                <ErrorMessage name="phone" component="p" className={errorClass} />
              </div>

              <div>
                <label htmlFor="pin" className="text-sm font-medium text-ink">
                  PIN
                </label>
                <div className="relative mt-2">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="pin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={PIN_LENGTH}
                    value={values.pin}
                    onChange={(event) => {
                      if (/^\d*$/.test(event.target.value)) {
                        setFieldValue('pin', event.target.value)
                      }
                    }}
                    onBlur={() => setFieldTouched('pin', true)}
                    placeholder="••••"
                    className={getPinFieldClass(Boolean(touched.pin && errors.pin))}
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

                <ErrorMessage name="pin" component="p" className={errorClass} />

                <div className="mt-3 flex items-center justify-between">
                  <label htmlFor="remember" className="flex items-center gap-2 text-sm text-muted">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-pin" className="text-xs font-medium text-brand hover:underline">
                    Forgot PIN?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} loading={isSubmitting}>
                Log In
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  )
}
