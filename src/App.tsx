import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home/Home'
import MainService from './pages/services/MainService'
import SendMoney from './pages/services/SendMoney'
import PayBills from './pages/services/PayBills'
import BankTransfers from './pages/services/BankTransfers'
import AirtimeDataBundles from './pages/services/AirtimeDataBundles'
import BecomeAnAgent from './pages/services/BecomeAnAgent'
import Fees from './pages/Fees/Fees'
import Faq from './pages/Faq/Faq'
import Contact from './pages/Contact/Contact'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './features/overview/pages/Overview'
import DashboardTransactions from './features/transactions/pages/Transactions'
import DashboardCustomers from './features/customers/pages/Customers'
import DashboardCompanyWallet from './features/wallets/pages/CompanyWallet'
import DashboardCashiers from './features/cashiers/pages/Cashiers'
import DashboardFinancial from './features/financial/pages/Financial'
import DashboardLedger from './features/ledger/pages/Ledger'
import DashboardLoans from './features/loans/pages/Loans'
import DashboardFees from './features/fees/pages/Fees'
import DashboardReconciliation from './features/reconciliation/pages/Reconciliation'
import DashboardSettings from './features/settings/pages/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'transactions', element: <DashboardTransactions /> },
      { path: 'customers', element: <DashboardCustomers /> },
      { path: 'company-wallet', element: <DashboardCompanyWallet /> },
      { path: 'cashiers', element: <DashboardCashiers /> },
      { path: 'financial', element: <DashboardFinancial /> },
      { path: 'ledger', element: <DashboardLedger /> },
      { path: 'loans', element: <DashboardLoans /> },
      { path: 'fees', element: <DashboardFees /> },
      { path: 'reconciliation', element: <DashboardReconciliation /> },
      { path: 'settings', element: <DashboardSettings /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
