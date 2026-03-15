import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

function ReceiptsDashboard() {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [year, setYear] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [receiptNo, setReceiptNo] = useState('')
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(null)

  const fetchReceipts = useCallback(async (searchParams) => {
    const query = searchParams && searchParams.toString() ? `?${searchParams.toString()}` : ''
    try {
      const res = await fetch(`http://localhost:8000/receipt${query}`)
      const data = await res.json()
      if (!res.ok) {
        setReceipts([])
        return
      }
      setReceipts(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setReceipts([])
    }
  },[]);

  useEffect(() => {
    fetchReceipts();
  },[fetchReceipts]);

  const handleSearch = async () => {
    const params = new URLSearchParams()
    if (year) params.append('year', year)
    if (studentClass) params.append('class', studentClass)
    if (receiptNo) params.append('receiptNo', receiptNo)
    fetchReceipts(params)
  }

  const handleDeleteReceipt = async (receiptId, receiptNumber) => {
    const confirmed = window.confirm(`Delete receipt ${receiptNumber ?? ''}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingReceipt(receiptId)
      const res = await fetch(`http://localhost:8000/receipt/${receiptId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        window.alert('Failed to delete receipt')
        return
      }

      setReceipts((previous) => previous.filter((item) => item.receipt_id !== receiptId))
      if (year || receiptNo) {
        handleSearch()
      }
    } catch (error) {
      window.alert('Failed to delete receipt')
    } finally {
      setIsDeletingReceipt(null)
    }
  }

  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const res = await fetch('http://localhost:8000/academic-year/get')
        const data = await res.json()
        if (!res.ok) {
          setAcademicYears([])
          return
        }
        setAcademicYears(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        setAcademicYears([])
      }
    }

    loadAcademicYears()
    fetchReceipts()
  }, [])

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavigationBar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-6 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-cyan-50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Receipts</h2>
              <p className="mt-1 text-sm text-slate-500">Track payment history and open receipt details.</p>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              {receipts.length} receipts
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="min-w-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Academic Year</option>
                {academicYears.map((item) => (
                  <option key={item.year_id ?? item.year_name} value={item.year_name}>
                    {item.year_name}
                  </option>
                ))}
              </select>
              <select
                value={studentClass}
                onChange={(event) => setStudentClass(event.target.value)}
                className="min-w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                type="text"
                value={receiptNo}
                onChange={(event) => setReceiptNo(event.target.value)}
                placeholder="Enter Receipt number"
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                onClick={() => navigate("/receipts/create")}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                + Create
              </button>
            </div>
          </div>
        </section>

          <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800">Receipt List</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-16 px-4 py-3 text-center text-sm font-semibold text-slate-600">S.No</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Receipt Number</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Name</th>
                  <th className="w-20 px-4 py-3 text-center text-sm font-semibold text-slate-600">Class</th>
                  <th className="w-32 px-4 py-3 text-center text-sm font-semibold text-slate-600">Academic Year</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Payment</th>
                  <th className="w-34 px-4 py-3 text-center text-sm font-semibold text-slate-600">Payment Mode</th>
                  <th className="w-32 px-4 py-3 text-center text-sm font-semibold text-slate-600">Payment Date</th>
                  <th className="w-52 px-4 py-3 text-center text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {receipts.length > 0 &&
                  receipts.map((item, index) => (
                    <tr key={item.receipt_id ?? item.receipt_number ?? index} className="odd:bg-white even:bg-slate-50/60 transition hover:bg-emerald-50">
                      <td className="px-4 py-3 text-slate-900">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-900">{item.receipt_number ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.full_name ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.class ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.year_name ?? '-'}</td>
                      <td className="px-4 py-3 font-medium text-emerald-600">{item.amount ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.payment_mode ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{new Date(item.payment_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/receipts/${item.receipt_id}`)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/receipts/${item.receipt_id}/edit`)}
                            className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(item.receipt_id, item.receipt_number)}
                            disabled={isDeletingReceipt === item.receipt_id}
                            className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeletingReceipt === item.receipt_id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      No receipts found. Adjust filters and try again.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </section>
      </main>
    </div>
      <Outlet context={{ refreshReceipts: handleSearch }} />
    </>
  )
}

export default ReceiptsDashboard