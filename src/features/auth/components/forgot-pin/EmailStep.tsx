import { motion } from 'motion/react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Mail } from 'lucide-react'
import { toast } from '../../../../lib/toast'
import Button from '../../../../components/ui/Button'
import { getFieldClass, errorClass, RequiredMark } from '../register/shared'

interface EmailStepProps {
  initialEmail: string
  onSubmit: (email: string) => void
}

interface EmailValues {
  email: string
}

interface ForgotPinResponse {
  message: string
}

const emailSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
})

export default function EmailStep({ initialEmail, onSubmit }: EmailStepProps) {
  return (
    <motion.div
      key="email"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Mail size={22} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Reset your PIN</h3>
        <p className="mt-2 text-sm text-muted">
          Enter the email on your account and we'll send you a reset code.
        </p>
      </div>

      <Formik<EmailValues>
        initialValues={{ email: initialEmail }}
        validationSchema={emailSchema}
        onSubmit={async (values, { setSubmitting }) => {

          let response: Response
          try {
            response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: values.email }),
            })
          } catch {
            toast.error('Network Error', {
              description: 'Could not reach the server. Check your connection and try again.',
              duration: 3000,
            })
            setSubmitting(false)
            return
          }

          try {
            const body: ForgotPinResponse = await response.json()

            if (!response.ok) {
              throw new Error(body.message ?? 'Could not send reset code')
            }

            toast.success(body.message, { duration: 2000 })

            onSubmit(values.email)
          } catch (error) {
            toast.error('Request Failed', {
              description: error instanceof Error ? error.message : 'Could not send reset code',
              duration: 3000,
            })
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email <RequiredMark />
              </label>
              <div className="relative mt-2">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand"
                />
                <span className="pointer-events-none absolute left-9 top-1/2 h-5 w-px -translate-y-1/2 bg-line" />
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className={`${getFieldClass(Boolean(touched.email && errors.email))} pr-4`}
                  placeholder="ashajuma@gmail.com"
                />
              </div>
              <ErrorMessage name="email" component="p" className={errorClass} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} loading={isSubmitting}>
              Send Reset Code
            </Button>
          </Form>
        )}
      </Formik>
    </motion.div>
  )
}
