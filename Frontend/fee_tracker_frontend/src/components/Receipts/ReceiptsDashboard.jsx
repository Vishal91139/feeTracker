import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const formatDateForInput = (value) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ReceiptsDashboard() {
  const navigate = useNavigate();
  const mainRef = useRef(null)
  const tableSectionRef = useRef(null)

  const [receipts, setReceipts] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [year, setYear] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [receiptNo, setReceiptNo] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [dateFilterType, setDateFilterType] = useState('any')
  const [isDateFiltersOpen, setIsDateFiltersOpen] = useState(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
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
    if (paymentMode) params.append('paymentMode', paymentMode)

    if (dateFilterType === 'specific' && paymentDate) {
      params.append('paymentDate', paymentDate)
    }

    if (dateFilterType === 'range') {
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
    }
    return params
  }, [year, studentClass, receiptNo, paymentMode, dateFilterType, paymentDate, fromDate, toDate])

  const handleDateFilterTypeChange = (nextType) => {
    setDateFilterType(nextType)
    if (nextType !== 'any') {
      setIsDateFiltersOpen(true)
    }

    if (nextType !== 'specific') {
      setPaymentDate('')
    }

    if (nextType !== 'range') {
      setFromDate('')
      setToDate('')
    }
  }

  const applyQuickDateFilter = (type) => {
    const today = new Date()
    const todayText = formatDateForInput(today)
    setIsDateFiltersOpen(true)

    if (type === 'today') {
      setDateFilterType('specific')
      setPaymentDate(todayText)
      setFromDate('')
      setToDate('')
      return
    }

    if (type === 'last7') {
      const from = new Date(today)
      from.setDate(today.getDate() - 6)
      setDateFilterType('range')
      setPaymentDate('')
      setFromDate(formatDateForInput(from))
      setToDate(todayText)
      return
    }

    if (type === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFilterType('range')
      setPaymentDate('')
      setFromDate(formatDateForInput(from))
      setToDate(todayText)
    }
  }

  const resetFilters = () => {
    setStudentClass('')
    setReceiptNo('')
    setPaymentMode('')
    setDateFilterType('any')
    setIsDateFiltersOpen(false)
    setPaymentDate('')
    setFromDate('')
    setToDate('')
  }

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

  useEffect(() => {
    if (!isDateFiltersOpen) {
      return
    }

    const timeoutId = setTimeout(() => {
      const mainNode = mainRef.current
      const tableNode = tableSectionRef.current
      if (!mainNode || !tableNode) {
        return
      }

      const topPosition = Math.max(0, tableNode.offsetTop - 12)
      mainNode.scrollTo({
        top: topPosition,
        behavior: 'smooth'
      })
    }, 120)

    return () => clearTimeout(timeoutId)
  }, [isDateFiltersOpen])

  return (
    <>
    <div className="flex min-h-screen bg-slate-50 md:h-screen md:overflow-hidden">
      <NavigationBar />
      <main
        ref={mainRef}
        className={`flex min-h-screen flex-1 flex-col px-3 pb-24 pt-20 sm:px-5 sm:pt-24 md:h-screen md:min-h-0 md:px-8 md:pt-8 ${
          isDateFiltersOpen ? 'md:overflow-y-auto md:pb-6' : 'md:overflow-hidden md:pb-8'
        }`}
      >
        <header className="mb-3 rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-cyan-50 to-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Receipts</h2>
              <p className="mt-1 text-sm text-slate-500">Track payments and maintain fee history</p>
            </div>
            <div className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm sm:px-4 sm:text-sm">
              {receipts.length} receipts
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-700 sm:text-xl">Filters</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDateFiltersOpen((prev) => !prev)}
                className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                {isDateFiltersOpen ? 'Hide Date Filters' : 'Show Date Filters'}
              </button>
            </div>

            <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[170px_140px_150px_minmax(220px,1fr)_auto_auto]">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Year</span>
                <select
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  disabled={isLoadingYears}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Mode</span>
                <select
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All modes</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-600">Class</span>
                <select
                  value={studentClass}
                  onChange={(event) => setStudentClass(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <div className="flex justify-stretch sm:justify-end lg:col-span-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:h-10 sm:w-auto sm:px-4 sm:text-sm"
                >
                  Reset
                </button>
              </div>

              <div className="flex justify-stretch sm:justify-end lg:col-span-1">
                <button
                  onClick={() => navigate("/receipts/create")}
                  className="h-9 w-full rounded-lg border border-blue-300 bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:h-10 sm:w-auto sm:px-4 sm:text-sm"
                >
                  + New Receipt
                </button>
              </div>
            </div>

            {isDateFiltersOpen && (
            <div className="rounded-xl border border-emerald-100 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-3 shadow-sm sm:p-4">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-[190px_minmax(150px,200px)_minmax(150px,200px)_1fr] lg:items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700">Date Filter</span>
                  <select
                    value={dateFilterType}
                    onChange={(event) => handleDateFilterTypeChange(event.target.value)}
                    className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="any">Any Date</option>
                    <option value="specific">Specific Date</option>
                    <option value="range">Date Range</option>
                  </select>
                </label>

                {dateFilterType === 'specific' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] sm:text-xs font-medium text-slate-700">Payment Date</span>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(event) => setPaymentDate(event.target.value)}
                      className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                )}

                {dateFilterType === 'range' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-700">From</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-700">To</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                  </>
                )}

                {dateFilterType === 'any' && (
                  <div className="rounded-lg border border-dashed border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-600 lg:col-span-2">
                    Showing receipts across all dates.
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quick picks</span>
                <button
                  type="button"
                  onClick={() => applyQuickDateFilter('today')}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDateFilter('last7')}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDateFilter('month')}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  This Month
                </button>
                {dateFilterType !== 'any' && (
                  <button
                    type="button"
                    onClick={() => handleDateFilterTypeChange('any')}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>
            )}
          </div>
          {year && !isCurrentYearSelected && (
            <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 sm:mt-3 sm:px-4 sm:text-sm">
              <span className="font-semibold">{year}</span>
            </div>
          )}
        </section>

          <section ref={tableSectionRef} className="mt-3 flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-5">
            
            {/* Desktop Table View */}
            <div className={`hidden md:block overflow-auto ${isDateFiltersOpen ? 'h-[66vh]' : 'h-full min-h-0'}`}>
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
                  <th className="w-44 px-3 py-3 text-center text-sm lg:text-base font-semibold text-slate-600">Actions</th>
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
                        <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                          <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}`)} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            View
                          </button>
                          <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}/edit`)} className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteReceipt(item.receipt_id, item.receipt_number)} disabled={isDeletingReceipt === item.receipt_id} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                            {isDeletingReceipt === item.receipt_id ? 'Deleting' : 'Delete'}
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
                  <div key={item.receipt_id ?? item.receipt_number ?? index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
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
                    <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
                      <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}`)} className="flex-1 rounded-md border border-blue-200 bg-blue-50 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 sm:py-1.5 sm:text-xs">
                        View
                      </button>
                      <button type="button" onClick={() => navigate(`/receipts/${item.receipt_id}/edit`)} className="flex-1 rounded-md border border-amber-200 bg-amber-50 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 sm:py-1.5 sm:text-xs">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteReceipt(item.receipt_id, item.receipt_number)} disabled={isDeletingReceipt === item.receipt_id} className="flex-1 rounded-md border border-rose-200 bg-rose-50 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 sm:py-1.5 sm:text-xs">
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