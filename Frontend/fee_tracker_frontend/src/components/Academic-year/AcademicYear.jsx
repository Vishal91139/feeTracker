import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function AcademicYear() {
  const navigate = useNavigate()
  const [academicYear, setAcademicYear] = useState([])
  const [query, setQuery] = useState('')
  const [isUpdatingYearId, setIsUpdatingYearId] = useState(null)
  const [isRenamingYearId, setIsRenamingYearId] = useState(null)
  const [isLoadingYears, setIsLoadingYears] = useState(true)
  const [openMenuYearId, setOpenMenuYearId] = useState(null)
  const [renameDraft, setRenameDraft] = useState({ id: null, yearName: '' })

  const fetchAcademicYears = useCallback(async () => {
    setIsLoadingYears(true)
    try {
      const res = await fetch(`${process.env.API_URL}/academic-year/get`)
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
  const currentYear = academicYear.find((year) => isEnabledFlag(year.is_current)) ?? null
  const previousYear = academicYear.find((year) => String(year.id) !== String(currentYear?.id)) ?? null

  const handleSetActiveYear = async (yearId) => {
    try {
      setIsUpdatingYearId(yearId)
      setOpenMenuYearId(null)
      const response = await fetch(`${process.env.API_URL}/academic-year/set-active/${yearId}`, {
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

  const openRenameModal = (year) => {
    setOpenMenuYearId(null)
    setRenameDraft({
      id: year.id,
      yearName: year.year_name,
    })
  }

  const closeRenameModal = () => {
    if (isRenamingYearId) {
      return
    }

    setRenameDraft({ id: null, yearName: '' })
  }

  const handleRenameYear = async () => {
    const nextYearName = String(renameDraft.yearName ?? '').trim()
    if (!renameDraft.id || !nextYearName) {
      window.alert('Academic year name is required')
      return
    }

    try {
      setIsRenamingYearId(renameDraft.id)
      const response = await fetch(`${process.env.API_URL}/academic-year/rename/${renameDraft.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: nextYearName }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        window.alert(payload?.message ?? 'Failed to rename academic year')
        return
      }

      closeRenameModal()
      await fetchAcademicYears()
    } catch (error) {
      window.alert('Failed to rename academic year')
    } finally {
      setIsRenamingYearId(null)
    }
  }

  return (
    <>
    <div className='flex min-h-screen bg-slate-50'>
      <NavigationBar />
      <main className="flex-1 px-3 pb-24 pt-20 sm:px-5 sm:pt-24 md:p-8 md:pb-8 md:pt-8">
        <header className="mb-4 rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-fuchsia-50 to-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Academic Years</h2>
              <p className="mt-1 text-sm text-slate-500">Configure yearly sessions and keep one active</p>
            </div>
            <div className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700 shadow-sm sm:px-4 sm:text-sm">
              {filteredYears.length} years
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className='flex flex-col justify-between gap-2 sm:flex-row sm:flex-wrap sm:gap-4'>
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search academic year'
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 sm:max-w-sm"
            />
            <button
              onClick={() => navigate('/academic-year/create', { replace: true })}
              className="h-10 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] sm:w-auto"
            >
              + Create Year
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-sky-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Year Transfer</p>
              <p className="mt-1 text-sm text-slate-700">
                {previousYear ? previousYear.year_name : 'Previous year not found'}
                {' '}to{' '}
                {currentYear ? currentYear.year_name : 'Current year not found'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Promote continuing students to current year and mark left students in one flow.</p>
            </div>
            <button
              type="button"
              disabled={!currentYear || !previousYear}
              onClick={() => navigate(`/academic-year/promote-students?sourceYearId=${previousYear?.id ?? ''}&targetYearId=${currentYear?.id ?? ''}`)}
              className="h-10 rounded-xl border border-indigo-300 bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Promote Students
            </button>
          </div>
        </section>

        <section className='mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {!isLoadingYears && filteredYears.map((year) => (
            <article key={year.id} className="relative rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-col gap-2 pr-10 sm:gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Academic Year</p>
                  <h3 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-slate-800">{year.year_name}</h3>
                </div>
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
              </div>

              <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                <button
                  type="button"
                  aria-label="Year actions"
                  onClick={() => setOpenMenuYearId((prev) => (prev === year.id ? null : year.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                  </svg>
                </button>

                {openMenuYearId === year.id && (
                  <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {!isEnabledFlag(year.is_active) && (
                      <button
                        type="button"
                        onClick={() => handleSetActiveYear(year.id)}
                        disabled={isUpdatingYearId === year.id}
                        className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                      >
                        {isUpdatingYearId === year.id ? 'Updating...' : 'Set Active'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openRenameModal(year)}
                      className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Rename
                    </button>
                  </div>
                )}
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

        {renameDraft.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-800">Rename Academic Year</h3>
                <p className="mt-1 text-xs text-slate-500">Update the display name for this academic year.</p>
              </div>
              <div className="px-5 py-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Year name</span>
                  <input
                    type="text"
                    value={renameDraft.yearName}
                    onChange={(event) => setRenameDraft((prev) => ({ ...prev, yearName: event.target.value }))}
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeRenameModal}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenameYear}
                  disabled={isRenamingYearId === renameDraft.id}
                  className="h-9 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isRenamingYearId === renameDraft.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    <Outlet context={{ refreshAcademicYears: fetchAcademicYears }} />
    </>
  )
}

export default AcademicYear