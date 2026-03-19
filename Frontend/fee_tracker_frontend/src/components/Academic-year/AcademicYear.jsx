import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function AcademicYear() {
  const navigate = useNavigate()
  const [academicYear, setAcademicYear] = useState([])
  const [query, setQuery] = useState('')
  const [isUpdatingYearId, setIsUpdatingYearId] = useState(null)
  const [isDeletingYearId, setIsDeletingYearId] = useState(null)
  const [isLoadingYears, setIsLoadingYears] = useState(true)

  const fetchAcademicYears = useCallback(async () => {
    setIsLoadingYears(true)
    try {
      const res = await fetch('http://localhost:8000/academic-year/get')
      const data = await res.json()
      if (!res.ok) {
        setAcademicYear([])
        return
      }
      setAcademicYear(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      setAcademicYear([])
    } finally {
      setIsLoadingYears(false)
    }
  }, [])

  useEffect(() => {
    fetchAcademicYears()
  }, [fetchAcademicYears])

  const filteredYears = useMemo(() => {
    if (!query.trim()) return academicYear
    return academicYear.filter((year) =>
      String(year.year_name ?? '').toLowerCase().includes(query.trim().toLowerCase()),
    )
  }, [academicYear, query])

  const isEnabledFlag = (value) => value === true || Number(value) === 1

  const handleSetActiveYear = async (yearId) => {
    try {
      setIsUpdatingYearId(yearId)
      const response = await fetch(`http://localhost:8000/academic-year/set-active/${yearId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: 1 }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        window.alert(payload?.message ?? 'Failed to set active year')
        return
      }

      await fetchAcademicYears()
    } catch (error) {
      window.alert('Failed to set active year')
    } finally {
      setIsUpdatingYearId(null)
    }
  }

  const handleDeleteYear = async (year) => {
    const confirmed = window.confirm(`Delete academic year ${year.year_name}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingYearId(year.id)
      const response = await fetch(`http://localhost:8000/academic-year/delete/${year.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        window.alert(payload?.message ?? 'Failed to delete academic year')
        return
      }

      await fetchAcademicYears()
    } catch (error) {
      window.alert('Failed to delete academic year')
    } finally {
      setIsDeletingYearId(null)
    }
  }

  return (
    <>
    <div className='flex min-h-screen bg-slate-50'>
      <NavigationBar />
      <main className="flex-1 p-3 sm:p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-2 sm:mb-6 rounded-lg sm:rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50 to-fuchsia-50 px-3 sm:px-6 py-2 sm:py-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-semibold text-slate-800">Academic Years</h2>
              <p className="hidden sm:block mt-1 text-xs sm:text-sm text-slate-500">Browse and filter configured academic years.</p>
            </div>
            <div className="rounded-full bg-white/80 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-violet-700 shadow-sm">
              {filteredYears.length} years
            </div>
          </div>
        </header>

        <section className="rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-2 sm:p-5 shadow-sm">
          <div className='flex flex-col sm:flex-row sm:flex-wrap justify-between gap-2 sm:gap-4'>
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search academic year'
              className="w-full sm:max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-700 shadow-sm transition focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <button
                onClick={() => navigate('/academic-year/create', { replace: true })}
                className="rounded-xl bg-emerald-600 px-2 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] w-full sm:w-auto"
              >
                + Create
              </button>
          </div>
        </section>

        <section className='mt-4 sm:mt-6 grid gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {!isLoadingYears && filteredYears.map((year) => (
            <article key={year.id} className="rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Academic Year</p>
                  <h3 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-slate-800">{year.year_name}</h3>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 sm:gap-3">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {isEnabledFlag(year.is_current) && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-sky-700">Current</span>
                  )}
                  {isEnabledFlag(year.is_active) && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-emerald-700">Active</span>
                  )}
                  {!isEnabledFlag(year.is_current) && !isEnabledFlag(year.is_active) && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-slate-600">Inactive</span>
                  )}
                  </div>

                  {!isEnabledFlag(year.is_active) && (
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleSetActiveYear(year.id)}
                        disabled={isUpdatingYearId === year.id || isDeletingYearId === year.id}
                        className="flex-1 sm:flex-none rounded-lg bg-blue-600 px-2 py-1 sm:px-3 sm:py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {isUpdatingYearId === year.id ? 'Updating...' : 'Set Active'}
                      </button>

                      {!isEnabledFlag(year.is_current) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteYear(year)}
                          disabled={isDeletingYearId === year.id || isUpdatingYearId === year.id}
                          className="flex-1 sm:flex-none rounded-lg bg-rose-600 px-2 py-1 sm:px-3 sm:py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {isDeletingYearId === year.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}

          {isLoadingYears && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
              <div className="inline-flex items-center gap-2">
                <span className="app-spinner" aria-hidden="true" />
                Loading academic years...
              </div>
            </div>
          )}

          {!isLoadingYears && filteredYears.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
              No academic years match your search.
            </div>
          )}
        </section>
      </main>
    </div>
    <Outlet context={{ refreshAcademicYears: fetchAcademicYears }} />
    </>
  )
}

export default AcademicYear