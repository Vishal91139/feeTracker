import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

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

function ReceiptsDashboard() {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [year, setYear] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [receiptNo, setReceiptNo] = useState('')
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(null)
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  const [isLoadingYears, setIsLoadingYears] = useState(true)

  const selectedYear = academicYears.find((item) => item.year_name === year) ?? null
  const isCurrentYearSelected = selectedYear ? (Number(selectedYear.is_current) === 1 || selectedYear.is_current === true) : false

  const receiptSearchParams = useMemo(() => {
    const params = new URLSearchParams()
    if (year) params.append('year', year)
    if (studentClass) params.append('class', studentClass)
    if (receiptNo.trim()) params.append('receiptNo', receiptNo.trim())
    return params
  }, [year, studentClass, receiptNo])

  const fetchReceipts = useCallback(async () => {
    const query = receiptSearchParams.toString() ? `?${receiptSearchParams.toString()}` : ''
    setIsLoadingReceipts(true)
    try {
      const res = await fetch(`${process.env.API_URL}/receipt${query}`)
      const data = await res.json()
      if (!res.ok) {
        setReceipts([])
        return
      }
      setReceipts(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setReceipts([])
    } finally {
      setIsLoadingReceipts(false)
    }
  }, [receiptSearchParams]);

  useEffect(() => {
    fetchReceipts();
  },[fetchReceipts]);

  const handleDeleteReceipt = async (receiptId, receiptNumber) => {
    const confirmed = window.confirm(`Delete receipt ${receiptNumber ?? ''}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingReceipt(receiptId)
      const res = await fetch(`${process.env.API_URL}/receipt/${receiptId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        window.alert('Failed to delete receipt')
        return
      }

      setReceipts((previous) => previous.filter((item) => item.receipt_id !== receiptId))
      fetchReceipts()
    } catch (error) {
      window.alert('Failed to delete receipt')
    } finally {
      setIsDeletingReceipt(null)
    }
  }

  useEffect(() => {
    const loadAcademicYears = async () => {
      setIsLoadingYears(true)
      try {
        const res = await fetch(`${process.env.API_URL}/academic-year/get`)
        const data = await res.json()
        if (!res.ok) {
          setAcademicYears([])
          return
        }
        const years = Array.isArray(data.data) ? data.data : []
        setAcademicYears(years)

        const activeYear = years.find((item) => Number(item.is_active) === 1 || item.is_active === true)
        if (activeYear) {
          setYear(activeYear.year_name)
        }
      } catch (err) {
        setAcademicYears([])
      } finally {
        setIsLoadingYears(false)
      }
    }

    loadAcademicYears()
  }, [])

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavigationBar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-2 sm:mb-6 rounded-lg sm:rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-cyan-50 px-3 sm:px-6 py-2 sm:py-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Receipts</h2>
              <p className="hidden sm:block mt-1 text-sm text-slate-500">Track payment history</p>
            </div>
            <div className="rounded-full bg-white/80 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 shadow-sm">
              {receipts.length}
            </div>
          </div>
        </header>

        <section className="rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl sm:text-xl font-semibold text-slate-700">Filters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[180px_160px_220px_auto] items-end gap-2.5 sm:gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Year</span>
                <select
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  disabled={isLoadingYears}
                  className="h-8 sm:h-9 w-full lg:w-45 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm lg:text-base text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All years</option>
                  {academicYears.map((item) => (
                    <option key={item.year_id ?? item.year_name} value={item.year_name}>
                      {item.year_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Class</span>
                <select
                  value={studentClass}
                  onChange={(event) => setStudentClass(event.target.value)}
                  className="h-8 sm:h-9 w-full lg:w-40 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm lg:text-base text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Receipt Number</span>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(event) => setReceiptNo(event.target.value)}
                  placeholder="e.g. RCPT-"
                  className="h-8 sm:h-9 w-full lg:w-55 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm lg:text-base text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <div className="sm:col-span-2 lg:col-span-1 flex justify-end">
                <button
                  onClick={() => navigate("/receipts/create")}
                  className="h-8 sm:h-9 rounded-lg border border-blue-300 bg-blue-600 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + New
                </button>
              </div>
            </div>
          </div>
          {year && !isCurrentYearSelected && (
            <div className="mt-1 sm:mt-3 rounded-lg sm:rounded-xl border border-emerald-100 bg-emerald-50 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-emerald-800">
              <span className="font-semibold">{year}</span>
            </div>
          )}
        </section>

          <section className="mt-3 sm:mt-5 rounded-lg sm:rounded-2xl border border-slate-200 bg-white shadow-sm">
            
            {/* Desktop Table View */}
            <div className="hidden md:block max-h-[56vh] overflow-auto">
              <table className="min-w-full table-auto">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="w-12 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">S.No</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Receipt #</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Student</th>
                  <th className="w-16 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Class</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Year</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Amount</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Mode</th>
                  <th className="px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Date</th>
                  <th className="w-32 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipts.length > 0 &&
                  receipts.map((item, index) => (
                    <tr key={item.receipt_id ?? item.receipt_number ?? index} className="odd:bg-white even:bg-slate-50/60 transition hover:bg-emerald-50">
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-900 align-middle">{index + 1}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-900 align-middle">{item.receipt_number ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.full_name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.class ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.year_name ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base font-medium text-emerald-600 align-middle">{item.amount ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{item.payment_mode ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-sm lg:text-base text-slate-700 align-middle">{formatDateForDisplay(item.payment_date)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}`)} className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            View
                          </button>
                          <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}/edit`)} className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteReceipt(item.receipt_id, item.receipt_number)} disabled={isDeletingReceipt === item.receipt_id} className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden max-h-[56vh] overflow-y-auto">
              <div className="space-y-3 p-4">
                {isLoadingReceipts && (
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <span className="app-spinner mr-2" />
                    Loading receipts...
                  </div>
                )}

                {!isLoadingReceipts && receipts.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No receipts found. Adjust filters and try again.
                  </div>
                )}

                {receipts.length > 0 && receipts.map((item, index) => (
                  <div key={item.receipt_id ?? item.receipt_number ?? index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">Receipt #{item.receipt_number ?? '-'}</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.full_name ?? '-'}</p>
                        <p className="text-xs text-slate-600">{item.class ?? '-'} • {item.year_name ?? '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">₹{item.amount ?? '-'}</p>
                        <p className="text-xs text-slate-500">{item.payment_mode ?? '-'}</p>
                        <p className="text-xs text-slate-500">{formatDateForDisplay(item.payment_date)}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}`)} className="flex-1 rounded-md border border-blue-200 bg-blue-50 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                        View
                      </button>
                      <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}/edit`)} className="flex-1 rounded-md border border-amber-200 bg-amber-50 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteReceipt(item.receipt_id, item.receipt_number)} disabled={isDeletingReceipt === item.receipt_id} className="flex-1 rounded-md border border-rose-200 bg-rose-50 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                        {isDeletingReceipt === item.receipt_id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Loading/Empty for both views */}
            {isLoadingReceipts && (
              <div className="hidden md:flex items-center justify-center py-10 text-sm text-slate-500">
                <span className="app-spinner mr-2" />
                Loading receipts...
              </div>
            )}
            {!isLoadingReceipts && receipts.length === 0 && (
              <div className="hidden md:flex items-center justify-center py-10 text-sm text-slate-500">
                No receipts found. Adjust filters and try again.
              </div>
            )}
          </section>
      </main>
    </div>
      <Outlet context={{ refreshReceipts: fetchReceipts }} />
    </>
  )
}

export default ReceiptsDashboard