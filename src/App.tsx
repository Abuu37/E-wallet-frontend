import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
import LoginForm from './features/auth/pages/LoginForm'
import CustomerOnboarding from './features/auth/pages/CustomerOnboarding'
import ForgotPin from './features/auth/pages/ForgotPin'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './features/overview/pages/Overview'
import DashboardTransactions from './features/transactions/pages/Transactions'
import DashboardCustomers from './features/customers/pages/Customers'
import DashboardCompanyWallet from './features/wallets/pages/CompanyWallet'
import DashboardAgents from './features/agents/pages/Agents'
import DashboardFinancial from './features/financial/pages/Financial'
import DashboardLedger from './features/ledger/pages/Ledger'
import DashboardLoans from './features/loans/pages/Loans'
import DashboardFees from './features/fees/pages/Fees'
import DashboardReconciliation from './features/reconciliation/pages/Reconciliation'
import DashboardSettings from './features/settings/pages/Settings'
import CustomerLayout from './components/layout/CustomerLayout'
import AccountOverview from './features/account/pages/AccountOverview'
import AccountWithdraw from './features/account/pages/AccountWithdraw'

// 🛡️ Import your Guard implementations
import { AuthProvider } from './components/context/AuthContext';
import { AuthGuard } from './components/Guard/AuthGuard';
import { RoleGuard } from './components/Guard/RoleGuard';
import IdleSessionGuard from './components/Guard/IdleSessionGuard';

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" theme="light" />
      <BrowserRouter>
        <IdleSessionGuard />
        <Routes>
          {/*==========  Public Routes ============ */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<MainService />} />
            <Route path="services/send-money" element={<SendMoney />} />
            <Route path="services/pay-bills" element={<PayBills />} />
            <Route path="services/bank-transfers" element={<BankTransfers />} />
            <Route path="services/airtime-data-bundles" element={<AirtimeDataBundles />} />
            <Route path="services/become-an-agent" element={<BecomeAnAgent />} />
            <Route path="fees" element={<Fees />} />
            <Route path="faq" element={<Faq />} />
            <Route path="contact" element={<Contact />} />

            {/*==========  Auth Routes ============== */}
            <Route path="login" element={<LoginForm />} />
            <Route path="register" element={<CustomerOnboarding />} />
            <Route path="forgot-pin" element={<ForgotPin />} />
          </Route>

          {/* PROTECTED ROUTE ZONE (User must be logged in to see anything below) */}
          <Route element={<AuthGuard />}>
            
            <Route element={<RoleGuard allowedRoles={['ADMIN', 'CASHIER']} />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="transactions" element={<DashboardTransactions />} />
                <Route path="customers" element={<DashboardCustomers />} />
                <Route path="company-wallet" element={<DashboardCompanyWallet />} />
                <Route path="agents" element={<DashboardAgents />} />
                <Route path="financial" element={<DashboardFinancial />} />
                <Route path="ledger" element={<DashboardLedger />} />
                <Route path="loans" element={<DashboardLoans />} />
                <Route path="fees" element={<DashboardFees />} />
                <Route path="reconciliation" element={<DashboardReconciliation />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>
            </Route>

            
            <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
              <Route path="/account" element={<CustomerLayout />}>
                <Route index element={<AccountOverview />} />
                <Route path="withdraw" element={<AccountWithdraw />} />
              </Route>
            </Route>

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
