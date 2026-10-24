import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { StatCard } from '../../components/StatCard'
import { StudentOutcomeList } from '../../components/StudentOutcomeList'
import type { Program, ProgramTermStat, RetentionRateRow, SchoolTerm } from '../../types/database'

export function RegistrarOverview() {
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [stats, setStats] = useState<ProgramTermStat[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [retention, setRetention] = useState<RetentionRateRow[]>([])
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: termData }, { data: statData }, { data: programData }, { data: retentionData }] = await Promise.all([
        supabase.from('school_terms').select('*').order('term_order', { ascending: false }),
        supabase.from('program_term_stats').select('*').order('term_order', { ascending: false }),
        supabase.from('programs').select('*').order('name'),
        supabase.from('retention_rates').select('*').order('term_order'),
      ])
      setTerms((termData as SchoolTerm[]) ?? [])
      setStats((statData as ProgramTermStat[]) ?? [])
      setPrograms((programData as Program[]) ?? [])
      setRetention((retentionData as RetentionRateRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const latestTerm = terms[0]
  const latestStats = stats.filter((s) => s.term_id === latestTerm?.id)
  const totalEnrolled = latestStats.reduce((sum, s) => sum + s.enrolled_count, 0)
  const filteredRetention = programFilter === 'all' ? retention : retention.filter((r) => r.program_id === programFilter)

  const chartData = useMemo(() => {
    const byTerm = new Map<string, { term: string; retained: number; shifted: number; dropped: number }>()
    for (const row of filteredRetention) {
      const label = `${row.school_year}\n${row.semester}`
      const existing = byTerm.get(row.term_id) ?? { term: label, retained: 0, shifted: 0, dropped: 0 }
      existing.retained += row.retained_count
      existing.shifted += row.shifted_count
      existing.dropped += row.dropout_count
      byTerm.set(row.term_id, existing)
    }
    return Array.from(byTerm.values())
  }, [filteredRetention])

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

      <div>
        <h2 className="text-lg mb-3">Retention monitoring</h2>
        <p className="text-muted text-sm mb-4">
          How each closed term compares to the one before it — same figures the president sees, scoped here so
          you can sanity-check detection results right after running them.
        </p>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : retention.length === 0 ? (
          <p className="text-muted text-sm">Nothing to show yet — run detection on a term above first.</p>
        ) : (
          <>
            <select className="input max-w-xs mb-4" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="all">All programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="card h-72 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#DFE2E8" vertical={false} />
                  <XAxis dataKey="term" stroke="#5B6472" fontSize={12} />
                  <YAxis stroke="#5B6472" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="retained" name="Retained" stackId="a" fill="#2F6F4E" />
                  <Bar dataKey="shifted" name="Shifted program" stackId="a" fill="#B08A2E" />
                  <Bar dataKey="dropped" name="Dropped out" stackId="a" fill="#B5482C" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="table-base">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Program</th>
                  <th>Prior cohort</th>
                  <th>Retained</th>
                  <th>Shifted</th>
                  <th>Dropped</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetention.map((r) => (
                  <tr key={`${r.term_id}-${r.program_id}`}>
                    <td>{r.school_year} — {r.semester} sem</td>
                    <td>{r.program_name}</td>
                    <td>{r.prior_cohort_size}</td>
                    <td>{r.retained_count}</td>
                    <td>{r.shifted_count}</td>
                    <td>{r.dropout_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <StudentOutcomeList />
    </div>
  )
}