import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV: Record<string, { to: string; label: string }[]> = {
  registrar: [
    { to: '/registrar', label: 'Overview' },
    { to: '/registrar/students', label: 'Students' },
    { to: '/registrar/enroll', label: 'Enroll students' },
    { to: '/registrar/close-term', label: 'Close a term' },
  ],
  career_guidance: [
    { to: '/career-guidance', label: 'Dropout cases' },
  ],
  president: [
    { to: '/president', label: 'Overview' },
    { to: '/president/programs', label: 'Program breakdown' },
    { to: '/president/cases', label: 'All cases' },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  registrar: 'Registrar',
  career_guidance: 'Career Guidance',
  president: 'School President',
}

export function Layout() {
  const { profile, signOut } = useAuth()
  const links = profile ? NAV[profile.role] ?? [] : []

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="text-lg leading-tight">Enrollment<br />Retention Analysis</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-white/10 font-medium' : 'text-white/75 hover:bg-white/5'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-sm">
          <p className="text-white/60">{profile ? ROLE_LABEL[profile.role] : ''}</p>
          <p className="font-medium mb-3">{profile?.full_name}</p>
          <button onClick={signOut} className="text-white/70 hover:text-white text-sm">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}
