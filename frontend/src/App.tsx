import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx'))
const HomePage = lazy(() => import('./pages/HomePage.tsx'))
const TrainsPage = lazy(() => import('./pages/TrainsPage.tsx'))
const OrderPage = lazy(() => import('./pages/OrderPage.tsx'))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.tsx'))
import TopNavigation from './components/TopNavigation'
import MainNavigation from './components/MainNavigation'
import BottomNavigation from './components/BottomNavigation'
import './App.css'
const PassengersPage = lazy(() => import('./pages/PassengersPage.tsx'))
const InformationPage = lazy(() => import('./pages/InformationPage.tsx'))
const PhoneVerificationPage = lazy(() => import('./pages/PhoneVerificationPage.tsx'))

function App() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isTrains = location.pathname === '/trains'
  return (
    <AuthProvider>
      <div className="App">
        <TopNavigation showWelcomeLogin={isLogin || isTrains} />
        <MainNavigation />
        <Suspense fallback={<div style={{padding:16}}>页面加载中…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainsPage />} />
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          } />
          <Route path="/orders/history" element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/passengers" element={
            <ProtectedRoute>
              <PassengersPage />
            </ProtectedRoute>
          } />
          <Route path="/information" element={
            <ProtectedRoute>
              <InformationPage />
            </ProtectedRoute>
          } />
          <Route path="/phone-verification" element={<PhoneVerificationPage />} />
        </Routes>
        </Suspense>
        <BottomNavigation />
      </div>
    </AuthProvider>
  )
}

export default App
