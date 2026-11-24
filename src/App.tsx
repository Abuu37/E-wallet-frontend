import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppRouter from './app/router'
import { SessionProvider } from './shared/auth/SessionProvider'
import { I18nProvider } from './shared/i18n'

export default function App() {
  return (
    <I18nProvider>
      <SessionProvider>
        <ToastContainer position="top-right" theme="light" />
        <AppRouter />
      </SessionProvider>
    </I18nProvider>
  )
}
