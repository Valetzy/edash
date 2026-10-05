import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'

import { RegistrarOverview } from './pages/registrar/RegistrarOverview'
import { Students } from './pages/registrar/Students'
import { EnrollmentForm } from './pages/registrar/EnrollmentForm'
import { CloseTerm } from './pages/registrar/CloseTerm'

import { CaseList } from './pages/career-guidance/CaseList'
import { CaseDetail } from './pages/career-guidance/CaseDetail'

import { PresidentOverview } from './pages/president/PresidentOverview'
import { ProgramAnalytics } from './pages/president/ProgramAnalytics'

function RoleHome() {
  const { profile } = useAuth()
  if (!profile) return null
  if (profile.role === 'registrar') return <Navigate to="/registrar" replace />
  if (profile.role === 'career_guidance') return <Navigate to="/career-guidance" replace />
  return <Navigate to="/president" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute allow={['registrar', 'career_guidance', 'president']}>
              <RoleHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar"
          element={
            <ProtectedRoute allow={['registrar']}>
              <RegistrarOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/students"
          element={
            <ProtectedRoute allow={['registrar']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/enroll"
          element={
            <ProtectedRoute allow={['registrar']}>
              <EnrollmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/close-term"
          element={
            <ProtectedRoute allow={['registrar']}>
              <CloseTerm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/career-guidance"
          element={
            <ProtectedRoute allow={['career_guidance']}>
              <CaseList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/career-guidance/cases/:caseId"
          element={
            <ProtectedRoute allow={['career_guidance', 'president']}>
              <CaseDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/president"
          element={
            <ProtectedRoute allow={['president']}>
              <PresidentOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/president/programs"
          element={
            <ProtectedRoute allow={['president']}>
              <ProgramAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/president/cases"
          element={
            <ProtectedRoute allow={['president']}>
              <CaseList />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
