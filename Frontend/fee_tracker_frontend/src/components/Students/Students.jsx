import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function Students() {
  const [year, setYear] = useState("")
  const [studentClass, setStudentClass] = useState("")
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
    if (name.trim()) params.append("name", name.trim());

    setIsLoadingStudents(true)
    try{
      const res = await fetch(`http://localhost:8000/student/get?${params.toString()}`)
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
  }, [year, studentClass, name])

  const handleSearch = () => {
    fetchStudents()
  }

  const handleDeleteStudent = async (studentId, studentName) => {
    const confirmed = window.confirm(`Delete ${studentName}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingStudent(studentId)
      const res = await fetch(`http://localhost:8000/student/${studentId}`, {
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
        const res = await fetch("http://localhost:8000/academic-year/get")
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavigationBar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-6 rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50 to-blue-50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Students</h2>
              <p className="mt-1 text-sm text-slate-500">Search and manage student records.</p>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
              {student.length} records
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isLoadingYears}
                className="min-w-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Academic Year</option>
                { academicYear.length > 0 && academicYear.map((item, idx) => (
                  <option key={idx} value={item.year_name}>{item.year_name}</option>
                ))}
              </select>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="min-w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Class</option>
                <option value="7th">7th</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Enter Student Name'
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSearch}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
              >
                Search
              </button>
              <button
              onClick={() => navigate("/students/create", {replace:true})}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                +Create
              </button>
            </div>
          </div>
          {year && !isCurrentYearSelected && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
              Showing data for academic year: <span className="font-semibold">{year}</span>
            </div>
          )}
        </section>

        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">Student List</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-24 px-4 py-3 text-center text-sm font-semibold text-slate-600">S.No</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Name</th>
                  <th className="w-36 px-4 py-3 text-center text-sm font-semibold text-slate-600">Class</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Parent Name</th>
                  <th className="w-52 px-4 py-3 text-center text-sm font-semibold text-slate-600">Academic Year</th>
                  <th className="w-52 px-4 py-3 text-center text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {student.length > 0 && student.map((item, idx) => (
                  <tr key={item.studentId ?? idx} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/60 transition-colors">
                    <td className="px-4 py-3 text-slate-900">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-900">{item.full_name}</td>
                    <td className="px-4 py-3 text-slate-700">{item.class}</td>
                    <td className="px-4 py-3 text-slate-700">{item.parent_name ? item.parent_name : '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.year_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${item.studentId}`)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${item.studentId}/edit`)}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(item.studentId, item.full_name)}
                          disabled={isDeletingStudent === item.studentId}
                          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeletingStudent === item.studentId ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoadingStudents && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <span className="app-spinner" aria-hidden="true" />
                        Loading students...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoadingStudents && student.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No students found. Adjust filters and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
    <Outlet context={{ year, studentClass, selectedYearId, refreshStudents: fetchStudents }} />
    </>
  )
}

export default Students