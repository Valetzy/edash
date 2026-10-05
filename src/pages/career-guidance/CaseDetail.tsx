import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { CaseDetail as CaseDetailType, FollowUpVisit, VisitOutcome } from '../../types/database'
import { REASON_CATEGORIES } from '../../types/database'

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<CaseDetailType | null>(null)
  const [visits, setVisits] = useState<FollowUpVisit[]>([])
  const [loading, setLoading] = useState(true)

  const [reasonCategory, setReasonCategory] = useState('financial')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState<VisitOutcome>('confirmed_dropout')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: caseData }, { data: visitData }] = await Promise.all([
      supabase.from('case_details').select('*').eq('id', caseId).single(),
      supabase.from('follow_up_visits').select('*').eq('case_id', caseId).order('visit_date', { ascending: false }),
    ])
    setDetail(caseData as CaseDetailType)
    setVisits((visitData as FollowUpVisit[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  async function handleLogVisit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error: visitError } = await supabase.from('follow_up_visits').insert({
      case_id: caseId,
      visited_by: profile?.id,
      reason_category: reasonCategory,
      reason_notes: notes || null,
      outcome,
    })

    if (visitError) {
      setSaving(false)
      setError(visitError.message)
      return
    }

    const newStatus = outcome === 're_enrolled' ? 'resolved' : outcome === 'unreachable' ? 'investigating' : 'resolved'
    await supabase
      .from('student_cases')
      .update({ status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null })
      .eq('id', caseId)

    setSaving(false)
    setNotes('')
    load()
  }

  if (loading) return <p className="text-muted">Loading…</p>
  if (!detail) return <p className="text-muted">Case not found.</p>

  return (
    <div className="space-y-8 max-w-2xl">
      <button className="text-sm text-muted underline" onClick={() => navigate(-1)}>← Back</button>

      <div>
        <h1 className="text-2xl mb-1">{detail.first_name} {detail.last_name}</h1>
        <p className="text-muted text-sm">Student no. {detail.student_no}</p>
        <p className="text-shift text-sm mt-1 font-medium">{detail.year_level_note}</p>
      </div>

      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-muted">Case type</p><p>{detail.case_type === 'dropout' ? 'Dropout' : 'Program shift'}</p></div>
        <div><p className="text-muted">Status</p><p className="capitalize">{detail.status}</p></div>
        <div><p className="text-muted">Last known program</p><p>{detail.from_program_name}</p></div>
        {detail.case_type === 'shifted' && (
          <div><p className="text-muted">Shifted to</p><p>{detail.to_program_name}</p></div>
        )}
        <div><p className="text-muted">Year level</p>
          <p>{detail.case_type === 'shifted' && detail.to_year_level ? `Year ${detail.from_year_level} → Year ${detail.to_year_level}` : `Year ${detail.from_year_level}`}</p>
        </div>
        <div><p className="text-muted">Last enrolled term</p><p>{detail.school_year} — {detail.semester} sem</p></div>
        <div><p className="text-muted">Contact number</p><p>{detail.contact_number ?? '—'}</p></div>
        <div className="col-span-2"><p className="text-muted">Address</p><p>{detail.address ?? '—'}</p></div>
      </div>

      {detail.case_type === 'dropout' && (
        <div>
          <h2 className="text-lg mb-3">Log a house visit</h2>
          <form onSubmit={handleLogVisit} className="card space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Reason for not enrolling</label>
              <select className="input" value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)}>
                {REASON_CATEGORIES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Outcome of this visit</label>
              <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value as VisitOutcome)}>
                <option value="confirmed_dropout">Confirmed dropout</option>
                <option value="confirmed_transfer_school">Confirmed transferred to another school</option>
                <option value="re_enrolled">Willing to re-enroll</option>
                <option value="unreachable">Household unreachable — try again</option>
                <option value="other">Other</option>
              </select>
            </div>
            {error && <p className="text-risk text-sm">{error}</p>}
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save visit'}</button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-lg mb-3">Visit history</h2>
        {visits.length === 0 ? (
          <p className="text-muted text-sm">No visits logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {visits.map((v) => (
              <li key={v.id} className="card text-sm">
                <p className="text-muted">{v.visit_date}</p>
                <p className="capitalize font-medium">{v.reason_category?.replace(/_/g, ' ')} — {v.outcome?.replace(/_/g, ' ')}</p>
                {v.reason_notes && <p className="mt-1">{v.reason_notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}