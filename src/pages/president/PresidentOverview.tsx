import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase } from '../../lib/supabase'
import { StatCard } from '../../components/StatCard'
import type { DropoutReasonSummary, ProgramTermStat, RetentionRateRow, SchoolTerm } from '../../types/database'

export function PresidentOverview() {
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [programStats, setProgramStats] = useState<ProgramTermStat[]>([])
  const [retention, setRetention] = useState<RetentionRateRow[]>([])
  const [reasons, setReasons] = useState<DropoutReasonSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: ps }, { data: rr }, { data: rs }] = await Promise.all([
        supabase.from('school_terms').select('*').order('term_order'),
        supabase.from('program_term_stats').select('*').order('term_order'),
        supabase.from('retention_rates').select('*').order('term_order'),
        supabase.from('dropout_reasons_summary').select('*'),
      ])
      setTerms((t as SchoolTerm[]) ?? [])
      setProgramStats((ps as ProgramTermStat[]) ?? [])
      setRetention((rr as RetentionRateRow[]) ?? [])
      setReasons((rs as DropoutReasonSummary[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const enrollmentTrend = useMemo(() => {
    const byTerm = new Map<string, { term: string; total: number }>()
    for (const row of programStats) {
      const key = row.term_id
      const label = `${row.school_year}\n${row.semester}`
      const existing = byTerm.get(key) ?? { term: label, total: 0 }
      existing.total += row.enrolled_count
      byTerm.set(key, existing)
    }
    return Array.from(byTerm.values())
  }, [programStats])

  const latestTerm = terms[terms.length - 1]
  const latestRetention = retention.filter((r) => r.term_id === latestTerm?.id)
  const totalDropout = latestRetention.reduce((s, r) => s + r.dropout_count, 0)
  const totalShift = latestRetention.reduce((s, r) => s + r.shifted_count, 0)
  const totalPrior = latestRetention.reduce((s, r) => s + r.prior_cohort_size, 0)
  const dropoutRate = totalPrior > 0 ? ((totalDropout / totalPrior) * 100).toFixed(1) : '—'

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl mb-1">President overview</h1>
        <p className="text-muted text-sm">School-wide enrollment trend and attrition, computed automatically from registrar data.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Dropout cases (latest term)" value={totalDropout} tone="risk" />
        <StatCard label="Program shifts (latest term)" value={totalShift} tone="shift" />
        <StatCard label="Dropout rate" value={`${dropoutRate}%`} tone="risk" sub="of prior term's cohort" />
        <StatCard label="Terms tracked" value={terms.length} />
      </div>

      <div>
        <h2 className="text-lg mb-3">Enrollment over time</h2>
        <div className="card h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollmentTrend}>
              <CartesianGrid stroke="#DFE2E8" vertical={false} />
              <XAxis dataKey="term" stroke="#5B6472" fontSize={12} />
              <YAxis stroke="#5B6472" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1C2333" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3">Why students leave</h2>
        {reasons.length === 0 ? (
          <p className="text-muted text-sm">No house-visit reasons logged yet — this fills in as career guidance completes visits.</p>
        ) : (
          <div className="card h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasons} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="#DFE2E8" horizontal={false} />
                <XAxis type="number" stroke="#5B6472" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="reason_category" stroke="#5B6472" fontSize={12} width={120} />
                <Tooltip />
                <Bar dataKey="total" fill="#B5482C" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/president/programs" className="btn btn-secondary">View per-program breakdown</Link>
        <Link to="/president/cases" className="btn btn-secondary">View all cases</Link>
      </div>
    </div>
  )
}
