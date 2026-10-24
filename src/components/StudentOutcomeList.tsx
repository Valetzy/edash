import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Program, SchoolTerm, StudentOutcome, StudentOutcomeType } from '../types/database'

const LABELS: Record<StudentOutcomeType, string> = {
  retained: 'Retained',
  shifted: 'Shifted',
  dropout: 'Dropped out',
}

const BADGE: Record<StudentOutcomeType, string> = {
  retained: 'badge-retain',
  shifted: 'badge-shift',
  dropout: 'badge-risk',
}

/**
 * Lists the specific students behind the retained / shifted / dropout counts.
 * Each row is a student's last enrollment in a term, labelled with what happened
 * to them the following term (same logic as the retention_rates view).
 * `refreshKey` can be bumped by a parent to reload after detection runs.
 */
export function StudentOutcomeList({
  outcomes = ['retained', 'shifted', 'dropout'],
  refreshKey = 0,
}: {
  outcomes?: StudentOutcomeType[]
  refreshKey?: number
}) {
  const [rows, setRows] = useState<StudentOutcome[]>([])
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [active, setActive] = useState<StudentOutcomeType>(outcomes[0])
  const [termId, setTermId] = useState('all')
  const [programId, setProgramId] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: o }, { data: t }, { data: p }] = await Promise.all([
        supabase.from('student_outcomes').select('*').order('term_order', { ascending: false }).order('last_name'),
        supabase.from('school_terms').select('*').order('term_order', { ascending: false }),
        supabase.from('programs').select('*').order('name'),
      ])
      setRows((o as StudentOutcome[]) ?? [])
      setTerms((t as SchoolTerm[]) ?? [])
      setPrograms((p as Program[]) ?? [])
      setLoading(false)
    }
    load()
  }, [refreshKey])

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (termId !== 'all' && r.term_id !== termId) return false
      if (programId !== 'all' && r.program_id !== programId) return false
      if (q && !`${r.first_name} ${r.last_name} ${r.student_no}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, termId, programId, search])

  const counts = useMemo(() => {
    const c: Record<StudentOutcomeType, number> = { retained: 0, shifted: 0, dropout: 0 }
    for (const r of scoped) c[r.outcome]++
    return c
  }, [scoped])

  const visible = scoped.filter((r) => r.outcome === active)

  return (
    <div>
      <h2 className="text-lg mb-3">Students by outcome</h2>
      <p className="text-muted text-sm mb-4">
        The individual students behind the numbers above. Each row shows a student's enrollment in a term and
        what happened to them the next term.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className="input max-w-[14rem]" value={termId} onChange={(e) => setTermId(e.target.value)}>
          <option value="all">All terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.school_year} — {t.semester} sem</option>
          ))}
        </select>
        <select className="input max-w-[16rem]" value={programId} onChange={(e) => setProgramId(e.target.value)}>
          <option value="all">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          className="input max-w-[14rem]"
          placeholder="Search name or student no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-4">
        {outcomes.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setActive(o)}
            className={`btn ${active === o ? 'btn-primary' : 'btn-secondary'}`}
          >
            {LABELS[o]} ({counts[o]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-muted text-sm">No {LABELS[active].toLowerCase()} students for this selection.</p>
      ) : (
        <table className="table-base">
          <thead>
            <tr>
              <th>Student</th>
              <th>Term</th>
              <th>Program</th>
              <th>Year level</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.enrollment_id}>
                <td>
                  {r.first_name} {r.last_name} <span className="text-muted">({r.student_no})</span>
                </td>
                <td>{r.school_year} — {r.semester} sem</td>
                <td>
                  {r.outcome === 'shifted' && r.to_program_name
                    ? `${r.program_name} → ${r.to_program_name}`
                    : r.program_name}
                </td>
                <td>Year {r.year_level}</td>
                <td><span className={`badge ${BADGE[r.outcome]}`}>{LABELS[r.outcome]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}