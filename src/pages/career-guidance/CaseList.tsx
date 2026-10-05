import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { CaseDetail, CaseStatus, CaseType } from '../../types/database'

const STATUS_TONE: Record<CaseStatus, 'risk' | 'shift' | 'retain'> = {
  pending: 'risk',
  investigating: 'shift',
  resolved: 'retain',
}

export function CaseList() {
  const { profile } = useAuth()
  const location = useLocation()
  const isPresidentView = location.pathname.startsWith('/president')

  const [cases, setCases] = useState<CaseDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<CaseType | 'all'>(isPresidentView ? 'all' : 'dropout')

  async function load() {
    setLoading(true)
    let query = supabase.from('case_details').select('*').order('created_at', { ascending: false })
    if (!isPresidentView) query = query.eq('case_type', 'dropout')
    const { data } = await query
    setCases((data as CaseDetail[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function claimCase(caseId: string) {
    await supabase.from('student_cases').update({ status: 'investigating', assigned_to: profile?.id }).eq('id', caseId)
    load()
  }

  const filtered = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter !== 'all' && c.case_type !== typeFilter) return false
    return true
  })

  const basePath = isPresidentView ? '/career-guidance' : '/career-guidance'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-1">{isPresidentView ? 'All student cases' : 'Dropout cases'}</h1>
        <p className="text-muted text-sm">
          {isPresidentView
            ? 'Every dropout and program-shift case detected across all terms.'
            : 'Students who were enrolled last term but did not re-enroll. Visit each household and log the reason.'}
        </p>
      </div>

      <div className="flex gap-4">
        <select className="input max-w-[10rem]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
        {isPresidentView && (
          <select className="input max-w-[10rem]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CaseType | 'all')}>
            <option value="all">Dropout + shift</option>
            <option value="dropout">Dropout only</option>
            <option value="shifted">Shifted only</option>
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">No cases match this filter.</p>
      ) : (
        <table className="table-base">
          <thead>
            <tr>
              <th>Student</th>
              <th>Term last seen</th>
              <th>Type</th>
              <th>Program</th>
              <th>Year level</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.first_name} {c.last_name} <span className="text-muted">({c.student_no})</span></td>
                <td>{c.school_year} — {c.semester} sem</td>
                <td>
                  <span className={`badge badge-${c.case_type === 'dropout' ? 'risk' : 'shift'}`}>
                    {c.case_type === 'dropout' ? 'Dropout' : 'Shifted'}
                  </span>
                </td>
                <td>
                  {c.case_type === 'shifted'
                    ? `${c.from_program_name} → ${c.to_program_name}`
                    : c.from_program_name}
                </td>
                <td className="text-muted text-xs">{c.year_level_note}</td>
                <td><span className={`badge badge-${STATUS_TONE[c.status]}`}>{c.status}</span></td>
                <td className="text-right space-x-2">
                  {!isPresidentView && c.case_type === 'dropout' && c.status === 'pending' && (
                    <button className="btn btn-secondary" onClick={() => claimCase(c.id)}>Start visit</button>
                  )}
                  <Link className="text-sm underline" to={`${basePath}/cases/${c.id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}