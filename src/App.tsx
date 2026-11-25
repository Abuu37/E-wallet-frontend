import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppRouter from './app/router'
import { SessionProvider } from './shared/auth/SessionProvider'
import { I18nProvider } from './shared/i18n'
import { ConnectionToasts } from './shared/ui/ConnectionToasts'

export default function App() {
  return (
    <I18nProvider>
      <SessionProvider>
        <ToastContainer position="top-right" theme="light" limit={4} />
        <ConnectionToasts />
        <AppRouter />
      </SessionProvider>
    </I18nProvider>
  )
}
