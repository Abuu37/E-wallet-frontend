import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { CreditCard, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import Button from "../../../components/ui/Button";
import ewalletImage from "../../../assets/imgs/ewallet.webp";
import paymentImage from "../../../assets/imgs/payment-img1.jpg";
import appScreenImage from "../../../assets/imgs/image 2.avif";
import { mockUsers, getRedirectPath } from "../utils/mockAuth";

import PhoneInput, { isValidPhoneNumber, type Country, type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

const slides = [ewalletImage, paymentImage, appScreenImage];
const SLIDE_DURATION = 15000;
const PIN_LENGTH = 4;

const getPinFieldClass = (hasError: boolean) =>
  `w-full rounded-full border py-2.5 pl-11 pr-11 text-sm tracking-[0.5em] outline-none transition-colors focus:bg-white ${
    hasError
      ? "border-red-400 bg-surface focus:border-red-500"
      : "border-transparent bg-surface focus:border-brand"
  }`;
const errorClass = "mt-2 text-xs font-medium text-red-600";

interface LoginValues {
  phone: string;
  pin: string;
}

const loginSchema = Yup.object({
  phone: Yup.string()
    .required("Phone number is required")
    .test("is-valid-phone", "Enter a valid phone number", (value) => Boolean(value && isValidPhoneNumber(value))),
  pin: Yup.string()
    .matches(/^\d{4}$/, `PIN must be ${PIN_LENGTH} digits`)
    .required("PIN is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [authError, setAuthError] = useState("");
  const [country, setCountry] = useState<Country>("TZ");

  const handleLogin = (values: LoginValues) => {
    const user = mockUsers.find(
      (item) =>
        normalizePhone(item.phone) === normalizePhone(values.phone) &&
        item.pin === values.pin,
    );

    if (!user) {
      setAuthError("Invalid phone number or PIN.");
      return;
    }

    setAuthError("");
    // Store the whole user, not just the role — ProtectedRoute reads `.role` off this.
    sessionStorage.setItem("user", JSON.stringify(user));
    navigate(getRedirectPath(user.role), { replace: true });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative flex min-h-[calc(100vh-73px)] items-stretch animate-gradient-pan p-6 sm:p-10 lg:p-16"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--color-brand-dark), var(--color-brand), var(--color-ink))",
        backgroundSize: "200% 200%",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative grid w-full overflow-hidden rounded-3xl shadow-2xl shadow-ink/10 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeSlide}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slides[activeSlide]})` }}
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-ink/50" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <motion.div
            className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand/25 blur-[120px]"
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
            animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute left-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-[100px]"
            animate={{ x: [0, 25, 0], y: [0, -25, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <Link
            to="/"
            className="relative flex items-center gap-2 text-lg font-extrabold tracking-tight text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <CreditCard size={18} />
            </span>
            WalletPesa
          </Link>

          <div className="relative max-w-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles size={14} className="text-accent" />
              Trusted by 250K+ users
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white">
              One wallet for every payment.
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Log in to send money, pay bills, and manage your card from
              anywhere.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === index
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="relative text-xs text-white/40">
            © {new Date().getFullYear()} WalletPesa
          </p>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-surface px-6 py-16">
          <motion.div
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand/30 blur-[100px]"
            animate={{ x: [0, -35, 0], y: [0, 25, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="text-center lg:text-left">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white lg:hidden">
                <CreditCard size={24} />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink lg:mt-0">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted">
                Log in to manage your WalletPesa account and card.
              </p>
            </div>

            <div className="mt-8 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
              <Formik<LoginValues>
                initialValues={{ phone: "", pin: "" }}
                validationSchema={loginSchema}
                onSubmit={(values, { setSubmitting }) => {
                  handleLogin(values);
                  setSubmitting(false);
                }}
              >
                {({ isSubmitting, errors, touched, values, setFieldValue, setFieldTouched }) => (
                  <Form className="space-y-5">
                    <div>
                      <label
                        htmlFor="phone"
                        className="text-sm font-medium text-ink"
                      >
                        Phone number
                      </label>
                      <div className="mt-2">
                        <PhoneInput
                          id="phone"
                          international
                          defaultCountry={country}
                          value={values.phone as Value}
                          onChange={(value) => setFieldValue("phone", value ?? "")}
                          onCountryChange={(value) => {
                            if (value) setCountry(value);
                          }}
                          onBlur={() => setFieldTouched("phone", true)}
                          placeholder="Enter phone number"
                          autoComplete="tel"
                          className={`phone-input ${touched.phone && errors.phone ? "PhoneInput--error" : ""}`}
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
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          autoComplete="current-password"
                          maxLength={PIN_LENGTH}
                          value={values.pin}
                          onChange={(event) => {
                            if (/^\d*$/.test(event.target.value)) {
                              setFieldValue("pin", event.target.value);
                            }
                          }}
                          onBlur={() => setFieldTouched("pin", true)}
                          placeholder="••••"
                          className={getPinFieldClass(Boolean(touched.pin && errors.pin))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
                          aria-label={showPin ? "Hide PIN" : "Show PIN"}
                        >
                          {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <ErrorMessage name="pin" component="p" className={errorClass} />

                      <div className="mt-3 flex items-center justify-between">
                        <label
                          htmlFor="remember"
                          className="flex items-center gap-2 text-sm text-muted"
                        >
                          <input
                            id="remember"
                            name="remember"
                            type="checkbox"
                            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                          />
                          Remember me
                        </label>
                        <Link
                          to="/contact"
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Forgot PIN?
                        </Link>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      Log In
                    </Button>

                    {authError && (
                      <p className="text-sm text-red-600" role="alert">
                        {authError}
                      </p>
                    )}
                  </Form>
                )}
              </Formik>
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-brand hover:underline"
              >
                Register
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
