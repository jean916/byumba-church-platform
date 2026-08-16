import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Parishes from './pages/Parishes'
import Groups from './pages/Groups'
import Announcements from './pages/Announcements'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Overview from './pages/admin/Overview'
import AdminParishes from './pages/admin/AdminParishes'
import AdminGroups from './pages/admin/AdminGroups'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminOfferings from './pages/admin/AdminOfferings'
import DashboardLayout from './components/admin/DashboardLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { DioceseProvider } from './context/DioceseContext'

export default function App() {
  return (
    <AuthProvider>
      <DioceseProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/parishes" element={<Parishes />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/account" element={<Profile />} />
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="parishes" element={<AdminParishes />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="offerings" element={<AdminOfferings />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
      </DioceseProvider>
    </AuthProvider>
  )
}
