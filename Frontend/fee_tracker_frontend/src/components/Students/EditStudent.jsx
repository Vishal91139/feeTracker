import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

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
        const res = await fetch(`http://localhost:8000/student/${studentId}${query}`)
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

    try {
      setIsSaving(true)
      setError('')

      const res = await fetch(`http://localhost:8000/student/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-linear-to-r from-amber-50 to-orange-50 px-8 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Edit Student</h2>
            <p className="mt-1 text-sm text-slate-500">Update basic student information.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/students', { replace: true })}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-8 py-8">
          {loading && <p className="text-sm text-slate-500">Loading student details...</p>}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}

          {!loading && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Student Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Parent Name</span>
                <input
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Mobile</span>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/students/${studentId}`, { replace: true })}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSaving}
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
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