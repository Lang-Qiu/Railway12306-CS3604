import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import TrainListPage from './pages/TrainListPage'
import OrderPage from './pages/OrderPage'
import PersonalInfoPage from './pages/PersonalInfoPage'
import PhoneVerificationPage from './pages/PhoneVerificationPage'
import PassengerManagementPage from './pages/PassengerManagementPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import PaymentPage from './pages/PaymentPage'
import SuccessfulPurchasePage from './pages/SuccessfulPurchasePage'
import BottomNavigation from './components/CS3604_12306/BottomNavigation'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/train" element={<TrainListPage />} />
          <Route path="/trains" element={<Navigate to="/train" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/order" element={<Navigate to="/orders" replace />} />
          <Route path="/information" element={<PersonalInfoPage />} />
          <Route path="/personal-info" element={<Navigate to="/information" replace />} />
          <Route path="/phone-verification" element={<PhoneVerificationPage />} />
          <Route path="/passengers" element={<PassengerManagementPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/purchase-success/:orderId" element={<SuccessfulPurchasePage />} />
        </Routes>
        <BottomNavigation />
      </div>
    </AuthProvider>
  )
}

export default App
