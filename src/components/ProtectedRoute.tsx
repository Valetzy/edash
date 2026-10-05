import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/database'

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow: UserRole[] }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div className="p-8 text-muted">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="p-8 text-muted">Setting up your account…</div>
  if (!allow.includes(profile.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
