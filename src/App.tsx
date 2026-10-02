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
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'

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
])

function App() {
  return <RouterProvider router={router} />
}

export default App
