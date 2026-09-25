import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { FavoritesProvider } from './context/FavoritesContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'

import Home from './pages/Home'
import Menu from './pages/Menu'
import FoodDetail from './pages/FoodDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

import DashboardOverview from './pages/dashboard/Overview'
import Orders from './pages/dashboard/Orders'
import OrderDetail from './pages/dashboard/OrderDetail'
import Favorites from './pages/dashboard/Favorites'
import Addresses from './pages/dashboard/Addresses'
import Notifications from './pages/dashboard/Notifications'
import Profile from './pages/dashboard/Profile'

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <FavoritesProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/menu/:slug" element={<Menu />} />
                <Route path="/food/:slug" element={<FoodDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:orderId" element={<OrderDetail />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="addresses" element={<Addresses />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </CategoriesProvider>
    </AuthProvider>
  )
}
