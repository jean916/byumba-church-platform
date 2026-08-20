import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Parishes from './pages/Parishes'
import Groups from './pages/Groups'
import Announcements from './pages/Announcements'
import Events from './pages/Events'
import Sermons from './pages/Sermons'
import Campaigns from './pages/Campaigns'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Overview from './pages/admin/Overview'
import AdminParishes from './pages/admin/AdminParishes'
import AdminGroups from './pages/admin/AdminGroups'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminOfferings from './pages/admin/AdminOfferings'
import AdminLeadership from './pages/admin/AdminLeadership'
import AdminEvents from './pages/admin/AdminEvents'
import AdminSermons from './pages/admin/AdminSermons'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import DashboardLayout from './components/admin/DashboardLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { DioceseProvider } from './context/DioceseContext'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <AuthProvider>
      <DioceseProvider>
      <ThemeProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/parishes" element={<Parishes />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/events" element={<Events />} />
            <Route path="/sermons" element={<Sermons />} />
            <Route path="/give" element={<Campaigns />} />
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
              <Route path="leadership" element={<AdminLeadership />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="sermons" element={<AdminSermons />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
      </ThemeProvider>
      </DioceseProvider>
    </AuthProvider>
  )
}
