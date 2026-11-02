import Navbar from './Components/Navbar'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Home from './Pages/Home'
import MyBooking from './Pages/MyBooking'
import TractorDetails from './Pages/tractorDetails'
import Tractors from './Pages/tractors'
import ExploreTractors from './Pages/ExploreTractors'
import Footer from './Components/Footer'
import Layout from './Pages/Owner/Layout'
import AddTractor from './Pages/Owner/AddTractor'
import ManageTractors from './Pages/Owner/ManageTractors'
import ManageBooking from './Pages/Owner/ManageBooking'
import Dashboard from './Pages/Owner/Dashboard'
import OwnerEarnings from './Pages/Owner/Earnings'
import OwnerProfile from './Pages/Owner/Profile'
import OwnerNotifications from './Pages/Owner/Notifications'
import FarmerDashboard from './Pages/Farmer/Dashboard'
import AdminDashboard from './Pages/Admin/Dashboard'
import SuperAdminLayout from './Pages/SuperAdmin/Layout'
import SuperAdminDashboard from './Pages/SuperAdmin/Dashboard'
import {
  UsersPage,
  OwnersPage,
  TractorsPage,
  BookingsPage,
  AnalyticsPage,
  ComplaintsPage,
  ActivityLogsPage,
  SettingsPage,
  ProfilePage,
} from './Pages/SuperAdmin/SuperAdminPages'
import Login from './Components/Login'
import LoginPage from './Pages/Auth/LoginPage'
import SignupPage from './Pages/Auth/SignupPage'
import AdminLoginPage from './Pages/Auth/AdminLoginPage'
import ProtectedRoute from './Pages/Auth/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext'

const App = () => {
  const { showLogin } = useAppContext()
  const location = useLocation()
  const isOwnerPath = location.pathname.startsWith('/owner')
  const isAdminPath = location.pathname.startsWith('/admin/dashboard')
  const isSuperAdminPath = location.pathname.startsWith('/superadmin')
  const isFarmerPath = location.pathname.startsWith('/farmer/dashboard')

  const hidePublicNav = isOwnerPath || isAdminPath || isSuperAdminPath || isFarmerPath

  return (
    <div>
      <Toaster />
      {showLogin && <Login />}

      {!hidePublicNav && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/admin/login' element={<AdminLoginPage />} />

        {/* Farmer Dashboard */}
        <Route
          path='/farmer/dashboard'
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/customer'
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path='/admin/dashboard'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin Workspace */}
        <Route
          path='/superadmin'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to='/superadmin/dashboard' replace />} />
          <Route path='dashboard' element={<SuperAdminDashboard />} />
          <Route path='users' element={<UsersPage />} />
          <Route path='owners' element={<OwnersPage />} />
          <Route path='tractors' element={<TractorsPage />} />
          <Route path='bookings' element={<BookingsPage />} />
          <Route path='analytics' element={<AnalyticsPage />} />
          <Route path='complaints' element={<ComplaintsPage />} />
          <Route path='activity-logs' element={<ActivityLogsPage />} />
          <Route path='settings' element={<SettingsPage />} />
          <Route path='profile' element={<ProfilePage />} />
        </Route>

        {/* Public Browsing & Booking */}
        <Route path='/tractor-details/:id' element={<TractorDetails />} />
        <Route path='/tractor' element={<Tractors />} />
        <Route path='/explore-tractor' element={<ExploreTractors />} />
        <Route path='/mybooking' element={<MyBooking />} />

        {/* Owner Workspace */}
        <Route
          path='/owner'
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='add-tractor' element={<AddTractor />} />
          <Route path='add-equipment' element={<AddTractor />} />
          <Route path='manage-tractor' element={<ManageTractors />} />
          <Route path='manage-booking' element={<ManageBooking />} />
          <Route path='earnings' element={<OwnerEarnings />} />
          <Route path='profile' element={<OwnerProfile />} />
          <Route path='notifications' element={<OwnerNotifications />} />
        </Route>
      </Routes>

      {!hidePublicNav && <Footer />}
    </div>
  )
}

export default App
