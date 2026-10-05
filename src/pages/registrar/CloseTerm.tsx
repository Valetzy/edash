import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import type { Program, RetentionRateRow, SchoolTerm, SemesterType } from '../../types/database'

export function CloseTerm() {
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [schoolYear, setSchoolYear] = useState('')
  const [semester, setSemester] = useState<SemesterType>('1st')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [detectTermId, setDetectTermId] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [result, setResult] = useState<{ dropout_count: number; shifted_count: number } | null>(null)
  const [detectError, setDetectError] = useState<string | null>(null)

  const [programs, setPrograms] = useState<Program[]>([])
  const [retention, setRetention] = useState<RetentionRateRow[]>([])
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [monitorLoading, setMonitorLoading] = useState(true)

  async function loadTerms() {
    const { data } = await supabase.from('school_terms').select('*').order('term_order', { ascending: false })
    setTerms((data as SchoolTerm[]) ?? [])
  }

  async function loadMonitoring() {
    setMonitorLoading(true)
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('programs').select('*').order('name'),
      supabase.from('retention_rates').select('*').order('term_order'),
    ])
    setPrograms((p as Program[]) ?? [])
    setRetention((r as RetentionRateRow[]) ?? [])
    setMonitorLoading(false)
  }

  useEffect(() => {
    loadTerms()
    loadMonitoring()
  }, [])

  async function handleCreateTerm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const nextOrder = terms.length > 0 ? Math.max(...terms.map((t) => t.term_order)) + 1 : 1
    const { error } = await supabase.from('school_terms').insert({
      school_year: schoolYear,
      semester,
      term_order: nextOrder,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSchoolYear('')
    loadTerms()
  }

  async function handleDetect() {
    if (!detectTermId) return
    setDetecting(true)
    setDetectError(null)
    setResult(null)
    const { data, error } = await supabase.rpc('detect_enrollment_changes', { p_term_id: detectTermId })
    setDetecting(false)
    if (error) {
      setDetectError(error.message)
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    setResult(row)
    loadTerms()
    loadMonitoring()
  }

  const filteredRetention = programFilter === 'all' ? retention : retention.filter((r) => r.program_id === programFilter)

  const chartData = useMemo(() => {
    const byTerm = new Map<string, { term: string; retained: number; shifted: number; dropped: number }>()
    for (const r of filteredRetention) {
      const label = `${r.school_year}\n${r.semester}`
      const existing = byTerm.get(r.term_id) ?? { term: label, retained: 0, shifted: 0, dropped: 0 }
      existing.retained += r.retained_count
      existing.shifted += r.shifted_count
      existing.dropped += r.dropout_count
      byTerm.set(r.term_id, existing)
    }
    return Array.from(byTerm.values())
  }, [filteredRetention])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl mb-1">Close a term</h1>
        <p className="text-muted text-sm">
          Once all enrollments for a term are entered, run detection to compare it against the previous term.
          Students who were enrolled before but don't appear now are flagged as dropout cases; students who
          reappear under a different program are flagged as shifted.
        </p>
      </div>

      <div>
        <h2 className="text-lg mb-3">Add a new term</h2>
        <form onSubmit={handleCreateTerm} className="card grid grid-cols-3 gap-4 max-w-xl">
          <div className="col-span-2">
            <label className="text-sm font-medium block mb-1">School year</label>
            <input className="input" placeholder="2026-2027" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Semester</label>
            <select className="input" value={semester} onChange={(e) => setSemester(e.target.value as SemesterType)}>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="summer">Summer</option>
            </select>
          </div>
          {error && <p className="text-risk text-sm col-span-3">{error}</p>}
          <div className="col-span-3">
            <button className="btn btn-secondary" disabled={saving}>{saving ? 'Adding…' : 'Add term'}</button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg mb-3">Run detection</h2>
        <div className="card max-w-xl space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Compare this term against the one before it</label>
            <select className="input" value={detectTermId} onChange={(e) => setDetectTermId(e.target.value)}>
              <option value="" disabled>Select a term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.school_year} — {t.semester} sem {t.is_closed ? '(already run)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleDetect} disabled={detecting || !detectTermId}>
            {detecting ? 'Analyzing…' : 'Detect dropouts & shifts'}
          </button>
          {detectError && <p className="text-risk text-sm">{detectError}</p>}
          {result && (
            <div className="flex gap-4 pt-2">
              <span className="badge badge-risk">{result.dropout_count} new dropout case(s)</span>
              <span className="badge badge-shift">{result.shifted_count} new shift case(s)</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3">All terms</h2>
        <table className="table-base max-w-xl">
          <thead>
            <tr>
              <th>Term</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id}>
                <td>{t.school_year} — {t.semester} sem</td>
                <td>{t.is_closed ? <span className="badge badge-retain">Detected</span> : <span className="badge badge-shift">Open</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg mb-3">Retention monitoring</h2>
        <p className="text-muted text-sm mb-4">
          How each closed term compares to the one before it — same figures the president sees, scoped here so
          you can sanity-check detection results right after running them.
        </p>

        {monitorLoading ? (
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
    </div>
  )
}