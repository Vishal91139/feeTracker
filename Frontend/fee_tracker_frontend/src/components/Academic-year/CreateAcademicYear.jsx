import React, { useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'

function CreateAcademicYear() {
  const location = useLocation()
  const navigate = useNavigate()
  const outletContext = useOutletContext()

  const isModalOpen = location.pathname === '/academic-year/create'

  const [yearName, setYearName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isModalOpen) {
    return null
  }

  const handleClose = () => {
    navigate('/academic-year', { replace: true })
  }

  const handleCreate = async (event) => {
    event.preventDefault()

    const trimmedYear = yearName.trim()
    if (!trimmedYear) {
      setError('Enter academic year')
      return
    }

    setError('')

    try {
      setIsCreating(true)
      const response = await fetch('http://localhost:8000/academic-year/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: trimmedYear }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.message ?? 'Failed to create academic year')
        return
      }

      if (outletContext?.refreshAcademicYears) {
        await outletContext.refreshAcademicYears()
      }

      navigate('/academic-year', { replace: true })
    } catch (requestError) {
      setError('Failed to create academic year')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <div className="app-modal-panel max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="flex flex-col gap-1 sm:gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 bg-linear-to-r from-violet-50 to-fuchsia-50 px-3 sm:px-8 py-2 sm:py-6">
            <div>
              <h1 className="text-lg sm:text-3xl font-semibold text-slate-900">Create Academic Year</h1>
              <p className="hidden sm:block mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600">
                Add a new academic year and confirm before saving.
              </p>
            </div>
            <button
              className="rounded-xl bg-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 whitespace-nowrap"
              onClick={handleClose}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="px-3 sm:px-8 py-4 sm:py-8 md:px-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Academic year<span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  name="yearName"
                  placeholder="e.g. 2025-2026"
                  value={yearName}
                  onChange={(event) => {
                    setYearName(event.target.value)
                    setError('')
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
              </label>
            </div>

            <div className="mt-6 sm:mt-10 flex flex-col-reverse sm:flex-row sm:flex-wrap items-center justify-between gap-2 sm:gap-4">
              <div className="text-xs text-slate-500">Fields marked with * are required.</div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-3 sm:px-8 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {isCreating ? 'Creating..' : 'Create Academic Year'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateAcademicYear
