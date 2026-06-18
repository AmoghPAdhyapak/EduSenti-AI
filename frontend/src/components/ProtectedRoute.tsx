import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!admin) return <Navigate to="/login" replace />
  return <>{children}</>
}
