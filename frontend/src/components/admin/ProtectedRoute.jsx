import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <div className="container" style={{ padding: '56px 24px' }}>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <div className="container" style={{ padding: '56px 24px' }}><p>Your account doesn't have admin access.</p></div>

  return children
}
