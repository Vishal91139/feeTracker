import React, { useEffect, useState } from 'react'

function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [year, setYear] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [name, setName] = useState('')

  const fetchReceipts = async (searchParams) => {
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
  }

  const handleSearch = async () => {
    const params = new URLSearchParams()
    if (year) params.append('year', year)
    if (studentClass) params.append('class', studentClass)
    if (name) params.append('name', name.trim())
    fetchReceipts(params)
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 text-center m-10">Receipts List</h2>
          </div>

          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
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
                className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter Student Name"
                className="w-64 bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              />
              <button
                onClick={handleSearch}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md hover:to-blue-600 transition ease-in-out duration-150"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-24 px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-100">S.No</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-200">Receipt Number</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-300">Name</th>
                  <th className="w-36 px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-400">Class</th>
                  <th className="w-36 px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-500">Academic Year</th>
                  <th className="w-36 px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-500">Payment</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-500">Payment Mode</th>
                  <th className="w-40 px-4 py-2 text-center text-sm font-semibold text-gray-700 bg-amber-600">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {receipts.length > 0 &&
                  receipts.map((item, index) => (
                    <tr key={item.receipt_id ?? item.receipt_number ?? index} className="odd:bg-white even:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{index + 1}</td>
                      <td className="px-4 py-2 text-gray-900">{item.receipt_number ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.full_name ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.class ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.year_name ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.amount ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.payment_mode ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{item.payment_date ?? '-'}</td>
                    </tr>
                  ))}

                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No receipts found. Adjust filters and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Receipts