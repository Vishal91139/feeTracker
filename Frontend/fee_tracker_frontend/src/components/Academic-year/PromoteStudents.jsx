import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function PromoteStudents() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [years, setYears] = useState([])
  const [sourceYearId, setSourceYearId] = useState('')
  const [targetYearId, setTargetYearId] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [choices, setChoices] = useState({})

  const [nameFilter, setNameFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const [isLoadingYears, setIsLoadingYears] = useState(true)
  const [isLoadingRows, setIsLoadingRows] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadYears = useCallback(async () => {
    setIsLoadingYears(true)
    setError('')

    try {
      const res = await fetch(`${process.env.API_URL}/academic-year/get`)
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to load academic years')
      }

      const list = Array.isArray(payload?.data) ? payload.data : []
      setYears(list)

      const current = list.find((item) => Number(item.is_current) === 1 || item.is_current === true)
      const previous = list.find((item) => String(item.id) !== String(current?.id))

      const sourceFromQuery = searchParams.get('sourceYearId')
      const targetFromQuery = searchParams.get('targetYearId')

      setTargetYearId(targetFromQuery || (current ? String(current.id) : ''))
      setSourceYearId(sourceFromQuery || (previous ? String(previous.id) : ''))
    } catch (loadError) {
      setYears([])
      setError(loadError.message || 'Failed to load academic years')
    } finally {
      setIsLoadingYears(false)
    }
  }, [searchParams])

  useEffect(() => {
    loadYears()
  }, [loadYears])

  const loadCandidates = useCallback(async () => {
    if (!sourceYearId || !targetYearId) {
      setRows([])
      setSummary(null)
      return
    }

    setIsLoadingRows(true)
    setError('')

    try {
      const res = await fetch(`${process.env.API_URL}/student-academics/carry-forward-candidates?sourceYearId=${sourceYearId}&targetYearId=${targetYearId}`)
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to load students')
      }

      const data = payload?.data ?? {}
      const nextRows = Array.isArray(data.rows) ? data.rows : []
      setRows(nextRows)
      setSummary(data.summary ?? null)

      setChoices(() => {
        const result = {}
        for (const row of nextRows) {
          result[String(row.studentId)] = {
            action: row.already_enrolled ? 'already' : 'promote',
            class: row.suggested_class || row.previous_class || '',
            totalfee: String(row.previous_total_fee ?? '')
          }
        }
        return result
      })
    } catch (loadError) {
      setRows([])
      setSummary(null)
      setChoices({})
      setError(loadError.message || 'Failed to load students')
    } finally {
      setIsLoadingRows(false)
    }
  }, [sourceYearId, targetYearId])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  const targetYearName = useMemo(() => {
    const year = years.find((item) => String(item.id) === String(targetYearId))
    return year?.year_name ?? '-'
  }, [years, targetYearId])

  const promoteCount = useMemo(() => {
    return rows.filter((row) => choices[String(row.studentId)]?.action === 'promote').length
  }, [rows, choices])

  const leftCount = useMemo(() => {
    return rows.filter((row) => choices[String(row.studentId)]?.action === 'left').length
  }, [rows, choices])

  const classOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => String(row.previous_class ?? '').trim()).filter(Boolean))).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const byName = !nameFilter.trim() || String(row.full_name ?? '').toLowerCase().includes(nameFilter.trim().toLowerCase())
      const byClass = !classFilter || String(row.previous_class ?? '') === classFilter
      return byName && byClass
    })
  }, [rows, nameFilter, classFilter])

  const visiblePromoteCount = useMemo(() => {
    return filteredRows.filter((row) => choices[String(row.studentId)]?.action === 'promote').length
  }, [filteredRows, choices])

  const updateChoice = (studentId, key, value) => {
    setChoices((previous) => ({
      ...previous,
      [String(studentId)]: {
        ...previous[String(studentId)],
        [key]: value
      }
    }))
  }

  const markAll = (action) => {
    setChoices((previous) => {
      const next = { ...previous }
      for (const row of filteredRows) {
        const key = String(row.studentId)
        if (next[key]?.action === 'already') continue
        next[key] = {
          ...next[key],
          action
        }
      }
      return next
    })
  }

  const submitPromotion = async () => {
    const students = rows
      .filter((row) => choices[String(row.studentId)]?.action === 'promote')
      .map((row) => ({
        studentId: row.studentId,
        class: String(choices[String(row.studentId)]?.class ?? '').trim(),
        totalfee: Number(choices[String(row.studentId)]?.totalfee)
      }))

    if (students.length === 0) {
      window.alert('No students selected to promote')
      return
    }

    const invalid = students.some((item) => !item.class || !Number.isFinite(item.totalfee) || item.totalfee <= 0)
    if (invalid) {
      window.alert('Please enter valid class and fee for selected students')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(`${process.env.API_URL}/student-academics/promote-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetYearId: Number(targetYearId),
          students
        })
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.message || 'Bulk promotion failed')
      }

      const inserted = payload?.data?.inserted ?? 0
      const skipped = payload?.data?.skipped ?? 0
      window.alert(`Done. Promoted: ${inserted}, Skipped: ${skipped}`)
      loadCandidates()
    } catch (submitError) {
      window.alert(submitError.message || 'Bulk promotion failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 md:h-screen md:overflow-hidden">
      <NavigationBar />
      <main className="flex min-h-screen flex-1 flex-col px-3 pb-24 pt-20 sm:px-5 sm:pt-24 md:h-screen md:min-h-0 md:overflow-y-auto md:px-8 md:pb-6 md:pt-8">
        <header className="mb-4 rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-sky-50 to-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Promote Students</h2>
              <p className="mt-1 text-sm text-slate-500">Transfer students from previous year to current year and mark left-outs.</p>
              {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
            </div>
            <button
              type="button"
              onClick={() => navigate('/academic-year')}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Back
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">From Year</span>
              <select
                value={sourceYearId}
                onChange={(event) => setSourceYearId(event.target.value)}
                disabled={isLoadingYears || isLoadingRows}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select source year</option>
                {years
                  .filter((item) => String(item.id) !== String(targetYearId))
                  .map((item) => (
                    <option key={item.id} value={item.id}>{item.year_name}</option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">To Year (Current)</span>
              <input disabled value={targetYearName} className="h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700" />
            </label>

            <button
              type="button"
              onClick={loadCandidates}
              disabled={isLoadingRows || !sourceYearId || !targetYearId}
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">Source</p>
            <p className="mt-1 text-xl font-semibold text-slate-800">{summary?.source_count ?? 0}</p>
          </article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
            <p className="text-xs text-emerald-700">Promote</p>
            <p className="mt-1 text-xl font-semibold text-emerald-800">{promoteCount}</p>
          </article>
          <article className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-sm">
            <p className="text-xs text-rose-700">Left</p>
            <p className="mt-1 text-xl font-semibold text-rose-800">{leftCount}</p>
          </article>
          <article className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
            <p className="text-xs text-cyan-700">New Joins</p>
            <p className="mt-1 text-xl font-semibold text-cyan-800">{summary?.new_joins_in_target_count ?? 0}</p>
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">Transfer Decisions</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => markAll('promote')} className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">Promote Visible</button>
              <button type="button" onClick={() => markAll('left')} className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700">Mark Visible Left</button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_180px]">
            <input
              type="text"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Search by student name"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            />
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            >
              <option value="">All classes</option>
              {classOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Prev Class</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Next Class</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Fee</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoadingRows && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-sm text-slate-500">Loading...</td></tr>
                )}

                {!isLoadingRows && filteredRows.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-sm text-slate-500">No students match current filters.</td></tr>
                )}

                {!isLoadingRows && filteredRows.map((row) => {
                  const key = String(row.studentId)
                  const current = choices[key]
                  return (
                    <tr key={row.studentId}>
                      <td className="px-2 py-2">
                        <p className="text-sm font-medium text-slate-800">{row.full_name}</p>
                        <p className="text-xs text-slate-500">Parent: {row.parent_name || '-'}</p>
                      </td>
                      <td className="px-2 py-2 text-sm text-slate-700">{row.previous_class || '-'}</td>
                      <td className="px-2 py-2">
                        <input
                          value={current?.class ?? ''}
                          onChange={(event) => updateChoice(row.studentId, 'class', event.target.value)}
                          disabled={current?.action === 'already'}
                          className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          value={current?.totalfee ?? ''}
                          onChange={(event) => updateChoice(row.studentId, 'totalfee', event.target.value)}
                          disabled={current?.action === 'already'}
                          className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {current?.action === 'already' ? (
                          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">Already enrolled</span>
                        ) : (
                          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => updateChoice(row.studentId, 'action', 'promote')}
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${current?.action === 'promote' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'}`}
                            >
                              Promote
                            </button>
                            <button
                              type="button"
                              onClick={() => updateChoice(row.studentId, 'action', 'left')}
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${current?.action === 'left' ? 'bg-rose-100 text-rose-800' : 'text-slate-600'}`}
                            >
                              Left
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Promote transfers students into current year; Left keeps their old-year history unchanged.</p>
            <button
              type="button"
              onClick={submitPromotion}
              disabled={isSubmitting || promoteCount === 0 || isLoadingRows}
              className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Processing...' : `Promote ${visiblePromoteCount} Visible (${promoteCount} Total)`}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PromoteStudents
