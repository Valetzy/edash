import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/database'

export function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('registrar')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, fullName, role)
    setBusy(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl mb-1">Enrollment Retention Analysis</h1>
        <p className="text-muted text-sm mb-6">Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-medium block mb-1">Full name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-medium block mb-1">Role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="registrar">Registrar</option>
                <option value="career_guidance">Career Guidance</option>
                <option value="president">School President</option>
              </select>
            </div>
          )}
          {error && <p className="text-risk text-sm">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="text-sm text-muted mt-4 underline"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
