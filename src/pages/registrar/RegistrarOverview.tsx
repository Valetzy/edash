import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatCard } from '../../components/StatCard'
import type { ProgramTermStat, SchoolTerm } from '../../types/database'

export function RegistrarOverview() {
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [stats, setStats] = useState<ProgramTermStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: termData }, { data: statData }] = await Promise.all([
        supabase.from('school_terms').select('*').order('term_order', { ascending: false }),
        supabase.from('program_term_stats').select('*').order('term_order', { ascending: false }),
      ])
      setTerms((termData as SchoolTerm[]) ?? [])
      setStats((statData as ProgramTermStat[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const latestTerm = terms[0]
  const latestStats = stats.filter((s) => s.term_id === latestTerm?.id)
  const totalEnrolled = latestStats.reduce((sum, s) => sum + s.enrolled_count, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl mb-1">Registrar overview</h1>
        <p className="text-muted text-sm">Add enrolled students and close out terms to trigger attrition detection.</p>
      </div>

      <div className="flex gap-4">
        <Link to="/registrar/students" className="btn btn-secondary">Manage students</Link>
        <Link to="/registrar/enroll" className="btn btn-primary">Enroll a student</Link>
        <Link to="/registrar/close-term" className="btn btn-secondary">Close a term</Link>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : latestTerm ? (
        <div>
          <h2 className="text-lg mb-3">
            Current term: {latestTerm.school_year} — {latestTerm.semester} sem
            {latestTerm.is_closed && <span className="badge badge-shift ml-2">closed</span>}
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Total enrolled this term" value={totalEnrolled} />
            <StatCard label="Programs offered" value={latestStats.length} />
            <StatCard label="Term status" value={latestTerm.is_closed ? 'Closed' : 'Open'} />
          </div>

          <table className="table-base">
            <thead>
              <tr>
                <th>Program</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {latestStats.map((s) => (
                <tr key={s.program_id}>
                  <td>{s.program_name}</td>
                  <td>{s.enrolled_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted">No terms yet — add one from "Close a term".</p>
      )}
    </div>
  )
}
