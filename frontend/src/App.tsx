import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const TrainsPage = lazy(() => import('./pages/TrainsPage'))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'))
import TopNavigation from './components/TopNavigation'
import MainNavigation from './components/MainNavigation'
import BottomNavigation from './components/BottomNavigation'
import './App.css'
const PassengersPage = lazy(() => import('./pages/PassengersPage'))

function App() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isTrains = location.pathname === '/trains'
  return (
    <div className="App">
      <TopNavigation showWelcomeLogin={isLogin || isTrains} />
      <MainNavigation />
      <Suspense fallback={<div style={{padding:16}}>页面加载中…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/trains" element={<TrainsPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/orders/history" element={<OrderHistoryPage />} />
        <Route path="/passengers" element={<PassengersPage />} />
      </Routes>
      </Suspense>
      <BottomNavigation />
    </div>
  )
}

export default App
