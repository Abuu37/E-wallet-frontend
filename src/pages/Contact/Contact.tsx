import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Mail, Phone, MapPin, Clock, User, MessageSquare } from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading'
import Button from '../../components/ui/Button'

const info = [
  { icon: Phone, label: 'Phone', value: '+255 617 812 845' },
  { icon: Mail, label: 'Email', value: 'support@walletpesa.co.tz' },
  { icon: MapPin, label: 'Office', value: 'Dar es Salaam, Tanzania' },
  { icon: Clock, label: 'Support Hours', value: 'Mon to Sat, 8:00 to 20:00' },
]

const getFieldClass = (hasError: boolean) =>
  `mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand ${
    hasError ? 'border-red-400' : 'border-line'
  }`
const errorClass = 'mt-1 text-xs font-medium text-red-600'

interface ContactValues {
  name: string
  email: string
  message: string
}

const contactSchema = Yup.object({
  name: Yup.string().trim().required('Full name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  message: Yup.string().trim().min(10, 'Message must be at least 10 characters').required('Message is required'),
})

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="We're here to help"
          subtitle="Reach out with questions about your card, fees, or becoming a merchant partner."
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="group flex items-center gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-brand transition-colors duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-white p-8">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-ink">Message received</h3>
                <p className="mt-2 text-sm text-muted">
                  Thanks for reaching out. Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <Formik<ContactValues>
                initialValues={{ name: '', email: '', message: '' }}
                validationSchema={contactSchema}
                onSubmit={(_values, { setSubmitting }) => {
                  setSubmitted(true)
                  setSubmitting(false)
                }}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-5">
                    <div>
                      <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-ink">
                        <User size={16} className="text-brand" />
                        Full name
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        className={getFieldClass(Boolean(touched.name && errors.name))}
                        placeholder="Asha Juma"
                      />
                      <ErrorMessage name="name" component="p" className={errorClass} />
                    </div>
                    <div>
                      <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Mail size={16} className="text-brand" />
                        Email
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        className={getFieldClass(Boolean(touched.email && errors.email))}
                        placeholder="you@example.com"
                      />
                      <ErrorMessage name="email" component="p" className={errorClass} />
                    </div>
                    <div>
                      <label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-ink">
                        <MessageSquare size={16} className="text-brand" />
                        Message
                      </label>
                      <Field
                        as="textarea"
                        id="message"
                        name="message"
                        rows={4}
                        className={getFieldClass(Boolean(touched.message && errors.message))}
                        placeholder="How can we help?"
                      />
                      <ErrorMessage name="message" component="p" className={errorClass} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      Send Message
                    </Button>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
