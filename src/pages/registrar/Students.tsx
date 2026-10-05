import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Student } from '../../types/database'

export function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [studentNo, setStudentNo] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    setStudents((data as Student[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error } = await supabase.from('students').insert({
      student_no: studentNo,
      first_name: firstName,
      last_name: lastName,
      contact_number: contact || null,
      address: address || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setStudentNo('')
    setFirstName('')
    setLastName('')
    setContact('')
    setAddress('')
    load()
  }

  const filtered = students.filter((s) =>
    `${s.student_no} ${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl mb-1">Students</h1>
        <p className="text-muted text-sm">Add student records here, then enroll them per term.</p>
      </div>

      <form onSubmit={handleAdd} className="card grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Student number</label>
          <input className="input" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Contact number</label>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">First name</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Last name</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium block mb-1">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Used later by career guidance for house visits" />
        </div>
        {error && <p className="text-risk text-sm col-span-2">{error}</p>}
        <div className="col-span-2">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add student'}</button>
        </div>
      </form>

      <div>
        <input
          className="input mb-4 max-w-sm"
          placeholder="Search by name or student number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Student no.</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.student_no}</td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>{s.contact_number ?? '—'}</td>
                  <td>{s.address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
