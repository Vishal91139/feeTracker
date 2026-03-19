import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

const formatDateForDisplay = (value) => {
  if (!value) return '-'

  const textValue = String(value)
  const dateMatch = textValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateMatch) {
    return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`
  }

  const parsed = new Date(textValue)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toLocaleDateString('en-IN')
}

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function StudentDetail() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const { selectedYearId, refreshStudents } = useOutletContext()

  const [student, setStudent] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [academicHistory, setAcademicHistory] = useState([])
  const [selectedHistoryYearId, setSelectedHistoryYearId] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshingYearData, setIsRefreshingYearData] = useState(false)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const hasLoadedOnceRef = useRef(false)

  const selectedHistory = academicHistory.find((item) => String(item.year_id) === String(selectedHistoryYearId)) ?? null

  useEffect(() => {
    let ignore = false

    const loadAcademicHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/student-academics/student/${studentId}`)
        const payload = await parseJsonSafely(response)

        if (!response.ok) {
          if (!ignore) {
            setAcademicHistory([])
            setSelectedHistoryYearId(selectedYearId ? String(selectedYearId) : '')
          }
          return
        }

        const historyRows = Array.isArray(payload.data) ? payload.data : []

        if (!ignore) {
          setAcademicHistory(historyRows)

          const selectedFromList = historyRows.find((item) => String(item.year_id) === String(selectedYearId))
          const currentYear = historyRows.find((item) => Number(item.is_current) === 1 || item.is_current === true)
          const fallbackYear = selectedFromList ?? currentYear ?? historyRows[0] ?? null
          setSelectedHistoryYearId(fallbackYear ? String(fallbackYear.year_id) : '')
        }
      } catch (historyError) {
        if (!ignore) {
          setAcademicHistory([])
          setSelectedHistoryYearId(selectedYearId ? String(selectedYearId) : '')
        }
      }
    }

    loadAcademicHistory()

    return () => {
      ignore = true
    }
  }, [studentId, selectedYearId])

  useEffect(() => {
    let ignore = false

    const loadDetails = async () => {
      const isSubsequentLoad = hasLoadedOnceRef.current
      if (isSubsequentLoad) {
        setIsRefreshingYearData(true)
      } else {
        setIsInitialLoading(true)
      }
      setError('')

      try {
        const targetYearId = selectedHistoryYearId || selectedYearId
        const query = targetYearId ? `?yearId=${targetYearId}` : ''
        const studentPromise = fetch(`http://localhost:8000/student/${studentId}${query}`)
        const receiptsPromise = selectedHistory?.year_name && selectedHistory?.class
          ? fetch(`http://localhost:8000/student/${studentId}/receipts?class=${encodeURIComponent(selectedHistory.class)}&year=${encodeURIComponent(selectedHistory.year_name)}`)
          : Promise.resolve(null)

        const [studentRes, receiptsRes] = await Promise.all([studentPromise, receiptsPromise])

        const studentPayload = await parseJsonSafely(studentRes)
        if (!studentRes.ok) {
          if (studentRes.status === 404) {
            throw new Error('Student not found.')
          }
          throw new Error(studentPayload?.message || 'Failed to load student details')
        }

        if (!ignore) {
          setStudent(studentPayload.data ?? null)
          hasLoadedOnceRef.current = true
        }

        if (receiptsRes) {
          const receiptsPayload = await parseJsonSafely(receiptsRes)
          if (!ignore) {
            setReceipts(receiptsRes.ok && Array.isArray(receiptsPayload.data) ? receiptsPayload.data : [])
          }
        } else if (!ignore) {
          setReceipts([])
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Failed to load student details')

          if (!isSubsequentLoad) {
            setStudent(null)
            setReceipts([])
          }
        }
      } finally {
        if (!ignore) {
          setIsInitialLoading(false)
          setIsRefreshingYearData(false)
        }
      }
    }

    loadDetails()

    return () => {
      ignore = true
    }
  }, [studentId, selectedYearId, selectedHistoryYearId, selectedHistory])

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
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="app-modal-panel w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
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
          {isInitialLoading && !student && (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <span className="app-spinner" aria-hidden="true" />
              Loading student details...
            </div>
          )}

          {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

          {student && (
            <>
              <div className="app-fade-in mb-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Profile Controls</h3>
                    <p className="mt-1 text-sm text-slate-500">Choose academic year to view profile and receipts.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedHistoryYearId}
                      onChange={(event) => setSelectedHistoryYearId(event.target.value)}
                      disabled={isRefreshingYearData}
                      className="min-w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {academicHistory.length === 0 && <option value="">No academic history</option>}
                      {academicHistory.map((item) => (
                        <option key={item.year_id} value={item.year_id}>
                          {item.year_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || isRefreshingYearData}
                      className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Student'}
                    </button>
                  </div>
                </div>
                {isRefreshingYearData && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-blue-700">
                    <span className="app-spinner" aria-hidden="true" />
                    Updating selected year details...
                  </div>
                )}
              </div>

              <div className="app-fade-in grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

              <div className="app-fade-in mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

              <div className="app-fade-in mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Receipt History</h3>
                    <p className="mt-1 text-sm text-slate-500">Receipts for the selected academic year.</p>
                  </div>
                </div>

                {isRefreshingYearData && (
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
                    <span className="app-spinner" aria-hidden="true" />
                    Refreshing receipts...
                  </div>
                )}

                {!selectedHistory?.year_name || !selectedHistory?.class ? (
                  <p className="mt-4 text-sm text-slate-500">No academic record available for the selected year.</p>
                ) : receipts.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No receipts found for this student in {selectedHistory.year_name}.</p>
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
                            <td className="px-4 py-3">{formatDateForDisplay(receipt.payment_date)}</td>
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