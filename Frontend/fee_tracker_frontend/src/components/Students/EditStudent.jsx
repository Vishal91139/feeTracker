import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobileRegex = /^\d{10}$/

function EditStudent() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const { selectedYearId, refreshStudents } = useOutletContext()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    parentName: '',
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadStudent = async () => {
      setLoading(true)
      setError('')

      try {
        const query = selectedYearId ? `?yearId=${selectedYearId}` : ''
        const res = await fetch(`${process.env.API_URL}/student/${studentId}${query}`)
        const payload = await res.json()

        if (!res.ok) {
          throw new Error(payload?.message || 'Failed to load student')
        }

        if (!ignore) {
          setFormData({
            name: payload.data?.full_name ?? '',
            email: payload.data?.email ?? '',
            mobile: payload.data?.mobile ?? '',
            parentName: payload.data?.parent_name ?? '',
          })
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Failed to load student')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadStudent()

    return () => {
      ignore = true
    }
  }, [studentId, selectedYearId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedEmail = String(formData.email ?? '').trim()
    const trimmedMobile = String(formData.mobile ?? '').trim()

    if (!emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email address')
      return
    }

    if (!mobileRegex.test(trimmedMobile)) {
      setError('Mobile number must be exactly 10 digits')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      const res = await fetch(`${process.env.API_URL}/student/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: trimmedEmail,
          mobile: trimmedMobile,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to update student')
      }

      refreshStudents()
      navigate(`/students/${studentId}`, { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'Failed to update student')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="app-modal-panel w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-linear-to-br from-amber-50 via-orange-50 to-white px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Edit Student</h2>
            <p className="mt-1 text-sm text-slate-500">Update basic student information.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/students', { replace: true })}
            className="rounded-xl bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 whitespace-nowrap"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-5 sm:px-8 sm:py-8">
          {loading && <p className="text-xs sm:text-sm text-slate-500">Loading student details...</p>}
          {!loading && error && <p className="text-xs sm:text-sm text-rose-600">{error}</p>}

          {!loading && (
            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Student Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Parent Name</span>
                <input
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Mobile</span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={10}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Email</span>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(`/students/${studentId}`, { replace: true })}
              className="rounded-xl bg-slate-100 px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-200 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSaving}
              className="h-11 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditStudent