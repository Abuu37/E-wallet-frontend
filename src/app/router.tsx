import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Contact from '../pages/Contact/Contact'
import Faq from '../pages/Faq/Faq'
import Fees from '../pages/Fees/Fees'
import Home from '../pages/Home/Home'
import AirtimeDataBundles from '../pages/services/AirtimeDataBundles'
import BankTransfers from '../pages/services/BankTransfers'
import BecomeAnAgent from '../pages/services/BecomeAnAgent'
import MainService from '../pages/services/MainService'
import PayBills from '../pages/services/PayBills'
import SendMoney from '../pages/services/SendMoney'
import { RequirePermission, RequireRole, RequireSession } from '../shared/auth/guards'
import { LoadingState } from '../shared/ui/controls'
import RouteError from './RouteError'

const SignInPage = lazy(() => import('../features/auth/SignInPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const ForgotPinPage = lazy(() => import('../features/auth/ForgotPinPage'))
const ChangePinPage = lazy(() => import('../features/auth/ChangePinPage'))

const ConsoleLayout = lazy(() => import('../features/console/ConsoleLayout'))
const OverviewPage = lazy(() => import('../features/console/overview/OverviewPage'))
const TreasuryPage = lazy(() => import('../features/console/treasury/TreasuryPage'))
const CustomersPage = lazy(() => import('../features/console/customers/CustomersPage'))
const AgentsPage = lazy(() => import('../features/console/agents/AgentsPage'))
const StaffPage = lazy(() => import('../features/console/staff/StaffPage'))

const CustomerLayout = lazy(() => import('../features/customer/CustomerLayout'))
const CustomerHome = lazy(() => import('../features/customer/CustomerHome'))
const AgentLayout = lazy(() => import('../features/agent/AgentLayout'))
const AgentHome = lazy(() => import('../features/agent/AgentHome'))
const AgentCashIn = lazy(() => import('../features/agent/AgentCashIn'))

const fallback = <LoadingState />

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'services', element: <MainService /> },
      { path: 'services/send-money', element: <SendMoney /> },
      { path: 'services/pay-bills', element: <PayBills /> },
      { path: 'services/bank-transfers', element: <BankTransfers /> },
      { path: 'services/airtime-data-bundles', element: <AirtimeDataBundles /> },
      { path: 'services/become-an-agent', element: <BecomeAnAgent /> },
      { path: 'fees', element: <Fees /> },
      { path: 'faq', element: <Faq /> },
      { path: 'contact', element: <Contact /> },
    ],
  },
  // Full-screen auth flows
  { path: '/login', element: <Suspense fallback={fallback}><SignInPage /></Suspense>, errorElement: <RouteError /> },
  { path: '/register', element: <Suspense fallback={fallback}><RegisterPage /></Suspense>, errorElement: <RouteError /> },
  { path: '/forgot-pin', element: <Suspense fallback={fallback}><ForgotPinPage /></Suspense>, errorElement: <RouteError /> },
  {
    element: <RequireSession />,
    errorElement: <RouteError />,
    children: [
      { path: '/change-pin', element: <Suspense fallback={fallback}><ChangePinPage /></Suspense> },
      {
        element: <RequireRole roles={['CUSTOMER']} />,
        children: [{
          path: '/app',
          element: <Suspense fallback={fallback}><CustomerLayout /></Suspense>,
          children: [{ index: true, element: <Suspense fallback={fallback}><CustomerHome /></Suspense> }],
        }],
      },
      {
        element: <RequireRole roles={['AGENT']} />,
        children: [{
          path: '/agent',
          element: <Suspense fallback={fallback}><AgentLayout /></Suspense>,
          children: [
            { index: true, element: <Suspense fallback={fallback}><AgentHome /></Suspense> },
            { path: 'cash-in', element: <Suspense fallback={fallback}><AgentCashIn /></Suspense> },
          ],
        }],
      },
      {
        element: <RequireRole roles={['ADMIN']} />,
        children: [{
          path: '/console',
          element: <Suspense fallback={fallback}><ConsoleLayout /></Suspense>,
          children: [
            { element: <RequirePermission permission="DASHBOARD_VIEW" />, children: [{ index: true, element: <Suspense fallback={fallback}><OverviewPage /></Suspense> }] },
            { element: <RequirePermission permission="FLOAT_VIEW" />, children: [{ path: 'treasury', element: <Suspense fallback={fallback}><TreasuryPage /></Suspense> }] },
            { element: <RequirePermission permission="USER_VIEW" />, children: [
              { path: 'customers', element: <Suspense fallback={fallback}><CustomersPage /></Suspense> },
              { path: 'agents', element: <Suspense fallback={fallback}><AgentsPage /></Suspense> },
              { path: 'staff', element: <Suspense fallback={fallback}><StaffPage /></Suspense> },
            ] },
          ],
        }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
