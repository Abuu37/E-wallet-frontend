import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Layout from './layouts/PublicLayout'
import Contact from '../features/public/pages/Contact/Contact'
import Faq from '../features/public/pages/Faq/Faq'
import Fees from '../features/public/pages/Fees/Fees'
import Home from '../features/public/pages/Home/Home'
import AirtimeDataBundles from '../features/public/pages/services/AirtimeDataBundles'
import BankTransfers from '../features/public/pages/services/BankTransfers'
import BecomeAnAgent from '../features/public/pages/services/BecomeAnAgent'
import MainService from '../features/public/pages/services/MainService'
import PayBills from '../features/public/pages/services/PayBills'
import SendMoney from '../features/public/pages/services/SendMoney'
import { RequirePermission, RequireRole, RequireSession } from '../shared/auth/guards'
import { LoadingState } from '../shared/ui/controls'
import RouteError from './RouteError'

const SignInPage = lazy(() => import('../features/auth/SignInPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const CustomerTransactions = lazy(() => import('../features/customer/TransactionsPage'))
const SendMoneyPage = lazy(() => import('../features/customer/SendMoneyPage'))
const WithdrawPage = lazy(() => import('../features/customer/WithdrawPage'))
const FindAgentPage = lazy(() => import('../features/customer/FindAgentPage'))
const AddMoneyPage = lazy(() => import('../features/customer/AddMoneyPage'))
const CustomerSettings = lazy(() => import('../features/customer/SettingsPage'))
const ForgotPinPage = lazy(() => import('../features/auth/ForgotPinPage'))
const ChangePinPage = lazy(() => import('../features/auth/ChangePinPage'))

const ConsoleLayout = lazy(() => import('./layouts/ConsoleLayout'))
const OverviewPage = lazy(() => import('../features/console/overview/OverviewPage'))
const TreasuryPage = lazy(() => import('../features/console/treasury/TreasuryPage'))
const CustomersPage = lazy(() => import('../features/console/customers/CustomersPage'))
const AgentsPage = lazy(() => import('../features/console/agents/AgentsPage'))
const StaffPage = lazy(() => import('../features/console/staff/StaffPage'))
const RolesPage = lazy(() => import('../features/console/roles/RolesPage'))
const TransactionsPage = lazy(() => import('../features/console/transactions/TransactionsPage'))
const TariffsPage = lazy(() => import('../features/console/tariffs/TariffsPage'))
const AuditPage = lazy(() => import('../features/console/audit/AuditPage'))

const CustomerLayout = lazy(() => import('./layouts/CustomerLayout'))
const CustomerHome = lazy(() => import('../features/customer/CustomerHome'))
const VerifyIdentityPage = lazy(() => import('../features/customer/VerifyIdentityPage'))
const AgentLayout = lazy(() => import('./layouts/AgentLayout'))
const AgentHome = lazy(() => import('../features/agent/AgentHome'))
const AgentCashIn = lazy(() => import('../features/agent/AgentCashIn'))
const AgentTransactions = lazy(() => import('../features/agent/AgentTransactions'))
const AgentFloat = lazy(() => import('../features/agent/AgentFloat'))
const AgentCommission = lazy(() => import('../features/agent/AgentCommission'))
const AgentSettings = lazy(() => import('../features/agent/AgentSettings'))

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
          children: [
            { index: true, element: <Suspense fallback={fallback}><CustomerHome /></Suspense> },
            { path: 'transactions', element: <Suspense fallback={fallback}><CustomerTransactions /></Suspense> },
            { path: 'send', element: <Suspense fallback={fallback}><SendMoneyPage /></Suspense> },
            { path: 'withdraw', element: <Suspense fallback={fallback}><WithdrawPage /></Suspense> },
            { path: 'agents', element: <Suspense fallback={fallback}><FindAgentPage /></Suspense> },
            { path: 'add-money', element: <Suspense fallback={fallback}><AddMoneyPage /></Suspense> },
            { path: 'verify', element: <Suspense fallback={fallback}><VerifyIdentityPage /></Suspense> },
            { path: 'settings', element: <Suspense fallback={fallback}><CustomerSettings /></Suspense> },
          ],
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
            { path: 'transactions', element: <Suspense fallback={fallback}><AgentTransactions /></Suspense> },
            { path: 'float', element: <Suspense fallback={fallback}><AgentFloat /></Suspense> },
            { path: 'commission', element: <Suspense fallback={fallback}><AgentCommission /></Suspense> },
            { path: 'settings', element: <Suspense fallback={fallback}><AgentSettings /></Suspense> },
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
            { element: <RequirePermission permission="TRANSACTION_VIEW_ALL" />, children: [{ path: 'transactions', element: <Suspense fallback={fallback}><TransactionsPage /></Suspense> }] },
            { element: <RequirePermission permission="CHARGE_VIEW" />, children: [{ path: 'tariffs', element: <Suspense fallback={fallback}><TariffsPage /></Suspense> }] },
            { element: <RequirePermission permission="AUDIT_VIEW" />, children: [{ path: 'audit', element: <Suspense fallback={fallback}><AuditPage /></Suspense> }] },
            { element: <RequirePermission permission="ROLE_VIEW" />, children: [{ path: 'roles', element: <Suspense fallback={fallback}><RolesPage /></Suspense> }] },
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
