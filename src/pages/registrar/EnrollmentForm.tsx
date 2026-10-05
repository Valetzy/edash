import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Enrollment, Program, SchoolTerm, Student } from '../../types/database'

export function EnrollmentForm() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [terms, setTerms] = useState<SchoolTerm[]>([])
  const [recent, setRecent] = useState<(Enrollment & { student_no?: string; program_name?: string })[]>([])

  const [studentId, setStudentId] = useState('')
  const [programId, setProgramId] = useState('')
  const [termId, setTermId] = useState('')
  const [yearLevel, setYearLevel] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadLookups() {
    const [{ data: s }, { data: p }, { data: t }] = await Promise.all([
      supabase.from('students').select('*').order('last_name'),
      supabase.from('programs').select('*').order('name'),
      supabase.from('school_terms').select('*').order('term_order', { ascending: false }),
    ])
    setStudents((s as Student[]) ?? [])
    setPrograms((p as Program[]) ?? [])
    setTerms((t as SchoolTerm[]) ?? [])
    if (t && t.length > 0 && !termId) setTermId((t as SchoolTerm[])[0].id)
  }

  async function loadRecent() {
    if (!termId) return
    const { data } = await supabase
      .from('enrollments')
      .select('*, students(student_no), programs(name)')
      .eq('term_id', termId)
      .order('created_at', { ascending: false })
      .limit(20)
    const rows = (data ?? []).map((r: any) => ({
      ...r,
      student_no: r.students?.student_no,
      program_name: r.programs?.name,
    }))
    setRecent(rows)
  }

  useEffect(() => {
    loadLookups()
  }, [])

  useEffect(() => {
    loadRecent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    const { error } = await supabase.from('enrollments').insert({
      student_id: studentId,
      program_id: programId,
      term_id: termId,
      year_level: yearLevel,
      status: 'enrolled',
      created_by: profile?.id,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Enrollment recorded.')
    setStudentId('')
    loadRecent()
  }

  const selectedTerm = terms.find((t) => t.id === termId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl mb-1">Enroll a student</h1>
        <p className="text-muted text-sm">Record one enrollment per student per term. Re-enrolling under a different program next term is how the system detects a course shift.</p>
      </div>

      <form onSubmit={handleSubmit} className="card grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium block mb-1">Term</label>
          <select className="input" value={termId} onChange={(e) => setTermId(e.target.value)} required>
            <option value="" disabled>Select a term</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.school_year} — {t.semester} sem {t.is_closed ? '(closed)' : ''}
              </option>
            ))}
          </select>
          {selectedTerm?.is_closed && (
            <p className="text-shift text-xs mt-1">This term is already closed — new enrollments here won't be picked up by detection again automatically.</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Student</label>
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
            <option value="" disabled>Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name}, {s.first_name} ({s.student_no})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Program</label>
          <select className="input" value={programId} onChange={(e) => setProgramId(e.target.value)} required>
            <option value="" disabled>Select a program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Year level</label>
          <select className="input" value={yearLevel} onChange={(e) => setYearLevel(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-risk text-sm col-span-2">{error}</p>}
        {message && <p className="text-retain text-sm col-span-2">{message}</p>}
        <div className="col-span-2">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record enrollment'}</button>
        </div>
      </form>

      <div>
        <h2 className="text-lg mb-3">Recent enrollments this term</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>Student no.</th>
              <th>Program</th>
              <th>Year level</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.student_no}</td>
                <td>{r.program_name}</td>
                <td>{r.year_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
