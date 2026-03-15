import React, { useEffect, useMemo, useState } from 'react'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function AcademicYear() {
  const [academicYear, setAcademicYear] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const resp = fetch("http://localhost:8000/academic-year/get")
    .then((res) => res.json())
    .then((data) => {
      setAcademicYear(Array.isArray(data.data) ? data.data : [])
    })
  }, [])

  const filteredYears = useMemo(() => {
    if (!query.trim()) return academicYear
    return academicYear.filter((year) =>
      String(year.year_name ?? '').toLowerCase().includes(query.trim().toLowerCase()),
    )
  }, [academicYear, query])

  return (
    <>
    <div className='flex min-h-screen bg-slate-50'>
      <NavigationBar />
      <main className="flex-1 p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-6 rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50 to-fuchsia-50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Academic Years</h2>
              <p className="mt-1 text-sm text-slate-500">Browse and filter configured academic years.</p>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
              {filteredYears.length} years
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className='flex flex-wrap gap-4'>
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search academic year'
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </section>

        <section className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {filteredYears.map((year) => (
            <article key={year.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Academic Year</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-800">{year.year_name}</h3>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Active</span>
              </div>
            </article>
          ))}

          {filteredYears.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
              No academic years match your search.
            </div>
          )}
        </section>
      </main>
    </div>
    </>
  )
}

export default AcademicYear