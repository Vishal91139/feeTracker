import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

function StudentDetail() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const { year, studentClass, selectedYearId, refreshStudents } = useOutletContext()

  const [student, setStudent] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadDetails = async () => {
      setLoading(true)
      setError('')

      try {
        const query = selectedYearId ? `?yearId=${selectedYearId}` : ''
        const studentPromise = fetch(`http://localhost:8000/student/${studentId}${query}`)
        const receiptsPromise = year && studentClass
          ? fetch(`http://localhost:8000/student/${studentId}/receipts?class=${encodeURIComponent(studentClass)}&year=${encodeURIComponent(year)}`)
          : Promise.resolve(null)

        const [studentRes, receiptsRes] = await Promise.all([studentPromise, receiptsPromise])

        const studentPayload = await studentRes.json()
        if (!studentRes.ok) {
          throw new Error(studentPayload?.message || 'Failed to load student details')
        }

        if (!ignore) {
          setStudent(studentPayload.data ?? null)
        }

        if (receiptsRes) {
          const receiptsPayload = await receiptsRes.json()
          if (!ignore) {
            setReceipts(receiptsRes.ok && Array.isArray(receiptsPayload.data) ? receiptsPayload.data : [])
          }
        } else if (!ignore) {
          setReceipts([])
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Failed to load student details')
          setStudent(null)
          setReceipts([])
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDetails()

    return () => {
      ignore = true
    }
  }, [studentId, selectedYearId, studentClass, year])

  const handleClose = () => {
    navigate('/students', { replace: true })
  }

  const handleDelete = async () => {
    if (!student) {
      return
    }

    const confirmed = window.confirm(`Delete ${student.full_name}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch(`http://localhost:8000/student/${studentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        window.alert('Failed to delete student')
        return
      }

      refreshStudents()
      navigate('/students', { replace: true })
    } catch (deleteError) {
      window.alert('Failed to delete student')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-linear-to-r from-sky-50 to-blue-50 px-8 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Student Details</h2>
            <p className="mt-1 text-sm text-slate-500">View the complete profile and payment summary.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/students/${studentId}/edit`)}
              className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-200"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[85vh] overflow-y-auto bg-slate-50 px-8 py-8">
          {loading && <p className="text-sm text-slate-500">Loading student details...</p>}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}

          {!loading && student && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Student Name</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{student.full_name}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Parent Name</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{student.parent_name ?? '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Class</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{student.class ?? '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Academic Year</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{student.year_name ?? '-'}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-2 text-sm font-medium text-slate-900 break-all">{student.email ?? '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Mobile</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{student.mobile ?? '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total Fee</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">INR {student.total_fee ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Paid / Due</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">INR {student.paid_amount ?? 0}</p>
                  <p className="mt-1 text-sm font-semibold text-rose-600">Due INR {student.due_amount ?? 0}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Receipt History</h3>
                    <p className="mt-1 text-sm text-slate-500">Receipts for the selected class and academic year.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Student'}
                  </button>
                </div>

                {!year || !studentClass ? (
                  <p className="mt-4 text-sm text-slate-500">Select an academic year and class on the students page to view related receipts.</p>
                ) : receipts.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No receipts found for this student in the selected filters.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm text-slate-500">
                          <th className="px-4 py-3">Receipt</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Mode</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt) => (
                          <tr key={receipt.ReceiptId} className="border-b border-slate-100 text-sm text-slate-700">
                            <td className="px-4 py-3">{receipt.receipt_number}</td>
                            <td className="px-4 py-3 font-medium text-emerald-600">INR {receipt.amount}</td>
                            <td className="px-4 py-3">{receipt.payment_mode}</td>
                            <td className="px-4 py-3">{receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString('en-IN') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDetail