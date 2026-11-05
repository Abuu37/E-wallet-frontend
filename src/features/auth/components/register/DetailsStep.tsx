import { motion } from 'motion/react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { User, Mail } from 'lucide-react'
import Swal from 'sweetalert2'
import Button from '../../../../components/ui/Button'
import PhoneInput, { isValidPhoneNumber, type Country } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { getFieldClass, errorClass, RequiredMark } from './shared'
import type { RegisterCustomerValues } from './types'

interface DetailsStepProps {
  initialValues: RegisterCustomerValues | null
  country: Country
  onCountryChange: (country: Country) => void
  onSubmit: (values: RegisterCustomerValues) => void
}

interface RegistrationErrorResponse {
  message: string
  errors: Partial<Record<keyof RegisterCustomerValues, string>> | null
}

const detailsSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  middleName: Yup.string().trim(),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string()
    .required('Phone number is required')
    .test('is-valid-phone', 'Enter a valid phone number', (value) =>
      Boolean(value && isValidPhoneNumber(value)),
    ),
})

export default function DetailsStep({
  initialValues,
  country,
  onCountryChange,
  onSubmit,
}: DetailsStepProps) {
  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      <Formik<RegisterCustomerValues>
        initialValues={
          initialValues ?? {
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            phone: '',
          }
        }
        validationSchema={detailsSchema}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          const payload: Record<string, string> = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            // the API expects a bare phone number ("255..."), PhoneInput produces "+255..."
            phone: values.phone.replace(/^\+/, ''),
          }
          if (values.middleName?.trim()) {
            payload.middleName = values.middleName.trim()
          }

          let response: Response
          try {
            response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/auth/customer-registration`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              },
            )
          } catch {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Network Error',
              text: 'Could not reach the server. Check your connection and try again.',
              showConfirmButton: false,
              timer: 3000,
            })
            setSubmitting(false)
            return
          }

          try {
            if (!response.ok) {
              const body: RegistrationErrorResponse = await response.json()

              if (body.errors) {
                setErrors(body.errors)
              } else {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'error',
                  text: body.message ?? 'Could not register',
                  showConfirmButton: false,
                  timer: 3000,
                })
              }
              return
            }

            onSubmit(values)
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-ink">
                  First name <RequiredMark />
                </label>
                <div className="relative mt-2">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <Field
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`${getFieldClass(
                      Boolean(touched.firstName && errors.firstName),
                    )} pr-4`}
                    placeholder="Asha"
                  />
                </div>
                <ErrorMessage name="firstName" component="p" className={errorClass} />
              </div>

              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-ink">
                  Last name <RequiredMark />
                </label>
                <div className="relative mt-2">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <Field
                    id="lastName"
                    name="lastName"
                    type="text"
                    className={`${getFieldClass(
                      Boolean(touched.lastName && errors.lastName),
                    )} pr-4`}
                    placeholder="Juma"
                  />
                </div>
                <ErrorMessage name="lastName" component="p" className={errorClass} />
              </div>
            </div>

            <div>
              <label htmlFor="middleName" className="text-sm font-medium text-ink">
                Middle name
              </label>
              <div className="relative mt-2">
                <User
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <Field
                  id="middleName"
                  name="middleName"
                  type="text"
                  className={`${getFieldClass(
                    Boolean(touched.middleName && errors.middleName),
                  )} pr-4`}
                  placeholder="Optional"
                />
              </div>
              <ErrorMessage name="middleName" component="p" className={errorClass} />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email <RequiredMark />
              </label>
              <div className="relative mt-2">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className={`${getFieldClass(Boolean(touched.email && errors.email))} pr-4`}
                  placeholder="you@example.com"
                />
              </div>
              <ErrorMessage name="email" component="p" className={errorClass} />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">
                Phone number <RequiredMark />
              </label>
              <div className="mt-2">
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry={country}
                  value={values.phone}
                  onChange={(value) => setFieldValue('phone', value ?? '')}
                  onCountryChange={(value) => {
                    if (value) onCountryChange(value)
                  }}
                  onBlur={() => setFieldTouched('phone', true)}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  className={`phone-input ${touched.phone && errors.phone ? 'PhoneInput--error' : ''}`}
                />
              </div>
              <ErrorMessage name="phone" component="p" className={errorClass} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} loading={isSubmitting}>
              Continue
            </Button>
          </Form>
        )}
      </Formik>
    </motion.div>
  )
}
