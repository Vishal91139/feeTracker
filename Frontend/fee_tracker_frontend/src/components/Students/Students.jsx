import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function Students() {
  const [year, setYear] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [feeStatus, setFeeStatus] = useState("")
  const [academicYear, setAcademicYear] = useState([])
  const [name, setName] = useState("")
  const [student, setStudent] = useState([])
  const [isDeletingStudent, setIsDeletingStudent] = useState(null)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingYears, setIsLoadingYears] = useState(true)

  const navigate = useNavigate();

  const selectedYearId = academicYear.find((item) => item.year_name === year)?.id ?? null
  const selectedYear = academicYear.find((item) => item.year_name === year) ?? null
  const isCurrentYearSelected = selectedYear ? (Number(selectedYear.is_current) === 1 || selectedYear.is_current === true) : false

  const fetchStudents = useCallback(async () => {
    const params = new URLSearchParams();

    if (year) params.append("year", year);
    if (studentClass) params.append("class", studentClass);
    if (feeStatus) params.append("feeStatus", feeStatus);
    if (name.trim()) params.append("name", name.trim());

    setIsLoadingStudents(true)
    try{
      const res = await fetch(`${process.env.API_URL}/student/get?${params.toString()}`)
      const data = await res.json()
      if(!res.ok) {
        setStudent([])
        return;
      }
      setStudent(Array.isArray(data.data) ? data.data : []);
    } catch(e) {
      setStudent([]);
    } finally {
      setIsLoadingStudents(false)
    }
  }, [year, studentClass, feeStatus, name])

  const handleDeleteStudent = async (studentId, studentName) => {
    const confirmed = window.confirm(`Delete ${studentName}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingStudent(studentId)
      const res = await fetch(`${process.env.API_URL}/student/${studentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        window.alert('Failed to delete student')
        return
      }

      setStudent((previous) => previous.filter((item) => item.studentId !== studentId))

      fetchStudents()
    } catch (error) {
      window.alert('Failed to delete student')
    } finally {
      setIsDeletingStudent(null)
    }
  }

  useEffect(() => {
    const fetchAcademicYear = async() => {
      setIsLoadingYears(true)
      try{
        const res = await fetch(`${process.env.API_URL}/academic-year/get`)
        const data = await res.json();
        if(!res.ok) {
          setAcademicYear([]);
          return
        }
        const years = Array.isArray(data.data) ? data.data : []
        setAcademicYear(years);

        const activeYear = years.find((item) => Number(item.is_active) === 1 || item.is_active === true)
        if (activeYear) {
          setYear(activeYear.year_name)
        }
      } catch(e) {
        setAcademicYear([]);
      } finally {
        setIsLoadingYears(false)
      }
    }
    fetchAcademicYear();
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <>
    <div className="flex min-h-screen bg-slate-50 md:h-screen md:overflow-hidden">
      <NavigationBar />
      <main className="flex min-h-screen flex-1 flex-col px-3 pb-24 pt-20 sm:px-5 sm:pt-24 md:h-screen md:min-h-0 md:overflow-hidden md:px-8 md:pb-8 md:pt-8">
        <header className="mb-3 rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-blue-50 to-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Students</h2>
              <p className="mt-1 text-sm text-slate-500">Manage student records across all classes</p>
            </div>
            <div className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700 shadow-sm sm:px-4 sm:text-sm">
              {student.length} records
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-700 sm:text-xl">Filters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[170px_150px_170px_minmax(220px,1fr)_auto]">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Year</span>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isLoadingYears}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:h-10"
                >
                  <option value="">All years</option>
                  { academicYear.length > 0 && academicYear.map((item, idx) => (
                    <option key={idx} value={item.year_name}>{item.year_name}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Class</span>
                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:h-10"
                >
                  <option value="">All classes</option>
                  <option value="7th">7th</option>
                  <option value="8th">8th</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Fee Status</span>
                <select
                  value={feeStatus}
                  onChange={(e) => setFeeStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Due/Cleared</option>
                  <option value="due">Due</option>
                  <option value="cleared">Cleared</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Student Name</span>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Search name'
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:h-10"
                />
              </label>

              <div className="flex justify-stretch sm:col-span-2 sm:justify-end lg:col-span-1">
                <button
                onClick={() => navigate("/students/create", {replace:true})}
                  className="h-9 w-full rounded-lg border border-emerald-300 bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:h-10 sm:w-auto sm:px-4 sm:text-sm"
                >
                  + New Student
                </button>
              </div>
            </div>
          </div>
          {year && !isCurrentYearSelected && (
            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:mt-3 sm:px-4 sm:text-sm">
              <span className="font-semibold">{year}</span>
            </div>
          )}
        </section>

        <section className="mt-3 flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-5">

          {/* Desktop Table View */}
          <div className="hidden md:block h-full min-h-0 overflow-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="w-12 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">S.No</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Name</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Class</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Parent</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Fee Status</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Year</th>
                  <th className="w-44 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {student.length > 0 && student.map((item, idx) => (
                  <tr key={item.studentId ?? idx} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/60 transition-colors">
                    <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-900 align-middle">{idx + 1}</td>
                    <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-900 align-middle">{item.full_name}</td>
                    <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.class}</td>
                    <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.parent_name ? item.parent_name : '-'}</td>
                    <td className="px-3 py-2.5 text-center align-middle">
                      {Number(item.due_amount ?? 0) > 0 ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          Due INR {Number(item.due_amount).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.year_name}</td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                        <button type="button" onClick={() => navigate(`/students/${item.studentId}`)} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                          View
                        </button>
                        <button type="button" onClick={() => navigate(`/students/${item.studentId}/edit`)} className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteStudent(item.studentId, item.full_name)} disabled={isDeletingStudent === item.studentId} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                          {isDeletingStudent === item.studentId ? 'Deleting' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="max-h-[62vh] overflow-y-auto md:hidden">
            <div className="space-y-3 p-3 sm:p-4">
              {isLoadingStudents && (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <span className="app-spinner mr-2" />
                  Loading students...
                </div>
              )}

              {!isLoadingStudents && student.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No students found. Adjust filters and try again.
                </div>
              )}

              {student.length > 0 && student.map((item, idx) => (
                <div key={item.studentId ?? idx} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">#{idx + 1}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.full_name}</p>
                      <p className="text-xs text-slate-600">{item.class} • {item.year_name}</p>
                      <p className="text-xs text-slate-600">Parent: {item.parent_name || '-'}</p>
                      {Number(item.due_amount ?? 0) > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-rose-700">Due INR {Number(item.due_amount).toLocaleString('en-IN')}</p>
                      ) : (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">Cleared</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
                    <button type="button" onClick={() => navigate(`/students/${item.studentId}`)} className="flex-1 rounded-md border border-blue-200 bg-blue-50 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 sm:py-1.5 sm:text-xs">
                      View
                    </button>
                    <button type="button" onClick={() => navigate(`/students/${item.studentId}/edit`)} className="flex-1 rounded-md border border-amber-200 bg-amber-50 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 sm:py-1.5 sm:text-xs">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteStudent(item.studentId, item.full_name)} disabled={isDeletingStudent === item.studentId} className="flex-1 rounded-md border border-rose-200 bg-rose-50 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 sm:py-1.5 sm:text-xs">
                      {isDeletingStudent === item.studentId ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Loading/Empty for desktop */}
          {isLoadingStudents && (
            <div className="hidden md:flex items-center justify-center py-10 text-sm text-gray-500">
              <span className="app-spinner mr-2" />
              Loading students...
            </div>
          )}
          {!isLoadingStudents && student.length === 0 && (
            <div className="hidden md:flex items-center justify-center py-10 text-sm text-gray-500">
              No students found. Adjust filters and try again.
            </div>
          )}
        </section>
      </main>
    </div>
    <Outlet context={{ year, studentClass, selectedYearId, refreshStudents: fetchStudents }} />
    </>
  )
}

export default Students