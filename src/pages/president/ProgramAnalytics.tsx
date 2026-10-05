import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import type { Program, RetentionRateRow } from '../../types/database'

export function ProgramAnalytics() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [rows, setRows] = useState<RetentionRateRow[]>([])
  const [programId, setProgramId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('programs').select('*').order('name'),
        supabase.from('retention_rates').select('*').order('term_order'),
      ])
      setPrograms((p as Program[]) ?? [])
      setRows((r as RetentionRateRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = programId === 'all' ? rows : rows.filter((r) => r.program_id === programId)

  const chartData = useMemo(() => {
    const byTerm = new Map<string, { term: string; retained: number; dropped: number; shifted: number }>()
    for (const r of filtered) {
      const label = `${r.school_year}\n${r.semester}`
      const existing = byTerm.get(r.term_id) ?? { term: label, retained: 0, dropped: 0, shifted: 0 }
      existing.retained += r.retained_count
      existing.dropped += r.dropout_count
      existing.shifted += r.shifted_count
      byTerm.set(r.term_id, existing)
    }
    return Array.from(byTerm.values())
  }, [filtered])

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl mb-1">Program breakdown</h1>
        <p className="text-muted text-sm">Compare how many students stayed, shifted out, or dropped out of each program, term over term.</p>
      </div>

      <select className="input max-w-xs" value={programId} onChange={(e) => setProgramId(e.target.value)}>
        <option value="all">All programs</option>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="card h-80">
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
          {filtered.map((r) => (
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
    </div>
  )
}
