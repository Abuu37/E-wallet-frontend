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
import DashboardLayout from './features/dashboard/components/DashboardLayout'
import Dashboard from './features/dashboard/pages/Dashboard'
import DashboardTransactions from './features/dashboard/pages/Transactions'
import DashboardCustomers from './features/dashboard/pages/Customers'
import DashboardCards from './features/dashboard/pages/Cards'
import DashboardSettings from './features/dashboard/pages/Settings'

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
      { index: true, element: <Dashboard /> },
      { path: 'transactions', element: <DashboardTransactions /> },
      { path: 'customers', element: <DashboardCustomers /> },
      { path: 'cards', element: <DashboardCards /> },
      { path: 'settings', element: <DashboardSettings /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
