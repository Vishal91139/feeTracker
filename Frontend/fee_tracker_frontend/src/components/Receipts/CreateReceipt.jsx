import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';

const classOptions = ['7th', '8th', '9th', '10th', '11th', '12th']
const paymentModes = ['Cash', 'Cheque', 'UPI', 'Bank Transfer', 'Card']

function CreateReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isModalOpen = location.pathname === "/receipts/create"

  const [academicYears, setAcademicYears] = useState([])
  const [students, setStudents] = useState([])
  const [isYearLoading, setIsYearLoading] = useState(false)
  const [isStudentLoading, setIsStudentLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    academicYearId: '',
    studentClass: '',
    studentId: '',
    amount: '',
    paymentMode: '',
    paymentDate: '',
    remarks: '',
  })

  const createReceipt = async() => {
    try {
      const payload = {
        academicYearId: formData.academicYearId,
        class: formData.studentClass,
        studentId: formData.studentId,
        amount: formData.amount,
        paymentMode: formData.paymentMode,
        paymentDate: formData.paymentDate,
        remarks: formData.remarks,
      };

      const res = await fetch("http://localhost:8000/receipt/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log(data)
    } catch (error) {
       console.error(error);
    }
  }

  useEffect(() => {
    const loadAcademicYears = async () => {
      setIsYearLoading(true)
      try {
        const response = await fetch('http://localhost:8000/academic-year/get')
        if (!response.ok) {
          setAcademicYears([])
          return
        }
        const payload = await response.json()
        setAcademicYears(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        setAcademicYears([])
      } finally {
        setIsYearLoading(false)
      }
    }

    loadAcademicYears()
  }, [])

  const selectedYear = useMemo(
    () => academicYears.find((item) => String(item.id) === String(formData.academicYearId)) ?? null,
    [academicYears, formData.academicYearId],
  )

  useEffect(() => {
    if (!selectedYear || !formData.studentClass) {
      setStudents([])
      setFormData((previous) => ({ ...previous, studentId: '' }))
      return
    }

    let ignore = false

    const loadStudents = async () => {
      setIsStudentLoading(true)
      try {
        const query = new URLSearchParams({
          year: selectedYear.year_name,
          class: formData.studentClass,
        })
        const response = await fetch(`http://localhost:8000/student/get?${query.toString()}`)
        if (!response.ok) {
          if (!ignore) setStudents([])
          return
        }
        const payload = await response.json()
        if (!ignore) setStudents(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        if (!ignore) setStudents([])
      } finally {
        if (!ignore) setIsStudentLoading(false)
      }
    }

    loadStudents()

    return () => {
      ignore = true
    }
  }, [formData.studentClass, selectedYear])

  useEffect(() => {
    setPreview(null)
  }, [formData])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.studentId) === String(formData.studentId)) ?? null,
    [students, formData.studentId],
  )

  const validate = () => {
    const nextErrors = {}
    if (!formData.studentId) nextErrors.studentId = 'Select a student'
    if (!formData.studentClass) nextErrors.studentClass = 'Select class'
    if (!formData.academicYearId) nextErrors.academicYearId = 'Select academic year'
    if (!formData.amount) nextErrors.amount = 'Enter amount'
    if (!formData.paymentMode) nextErrors.paymentMode = 'Choose payment mode'
    if (!formData.paymentDate) nextErrors.paymentDate = 'Pick payment date'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) {
      setPreview(null)
      return
    }

    const yearDetail = selectedYear
    const receiptDraft = {
      receiptNumber: 'Pending',
      student: selectedStudent?.full_name ?? 'Selected student',
      class: formData.studentClass,
      academicYear: yearDetail?.year_name ?? 'Selected year',
      amount: Number(formData.amount).toFixed(2),
      paymentMode: formData.paymentMode,
      paymentDate: formData.paymentDate,
      remarks: formData.remarks || '—',
    }

    setPreview(receiptDraft)
  }

  const handleClose = () => {
    navigate('/receipts', { replace: true })
  }

  if (!isModalOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-slate-950 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <button 
              className='px-7 py-4 bg-red-500 rounded-2xl'
              onClick={handleClose}
            >close</button>
          <div className="rounded-3xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
            
            <div className="border-b border-slate-200 px-10 py-8">
              <h1 className="text-3xl font-semibold text-slate-900">Create Receipt</h1>
              <p className="mt-2 text-sm text-slate-600">
                Fill every required field to draft a receipt. Submission wiring can be added once API integration is ready.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-10 py-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Academic Year<span className="text-rose-500">*</span></span>
                  <select
                    name="academicYearId"
                    value={formData.academicYearId}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select academic year</option>
                    {isYearLoading && <option value="" disabled>Loading...</option>}
                    {!isYearLoading &&
                      academicYears.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.year_name}
                        </option>
                      ))}
                  </select>
                  {errors.academicYearId && <span className="text-xs font-medium text-rose-500">{errors.academicYearId}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Class<span className="text-rose-500">*</span></span>
                  <select
                    name="studentClass"
                    value={formData.studentClass}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select class</option>
                    {classOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.studentClass && <span className="text-xs font-medium text-rose-500">{errors.studentClass}</span>}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Student<span className="text-rose-500">*</span></span>
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    disabled={!formData.studentClass || !formData.academicYearId || isStudentLoading}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">{isStudentLoading ? 'Loading students…' : 'Select student'}</option>
                    {students.map((item) => (
                      <option key={item.studentId} value={item.studentId}>
                        {item.full_name} • {item.parent_name} • Due {item.due_amount ?? 0}
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <span className="text-xs font-medium text-rose-500">{errors.studentId}</span>}
                  {!errors.studentId && !isStudentLoading && formData.studentClass && formData.academicYearId && students.length === 0 && (
                    <span className="text-xs text-amber-600">No students found for the chosen class and academic year.</span>
                  )}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Amount<span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter amount received"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.amount && <span className="text-xs font-medium text-rose-500">{errors.amount}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Payment Mode<span className="text-rose-500">*</span></span>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select mode</option>
                    {paymentModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                  {errors.paymentMode && <span className="text-xs font-medium text-rose-500">{errors.paymentMode}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Payment Date<span className="text-rose-500">*</span></span>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.paymentDate && <span className="text-xs font-medium text-rose-500">{errors.paymentDate}</span>}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Remarks</span>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Notes about this payment"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              {selectedStudent && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Student snapshot</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <span>Student: {selectedStudent.full_name}</span>
                    <span>Parent: {selectedStudent.parent_name}</span>
                    <span>Due amount: {selectedStudent.due_amount ?? 'N/A'}</span>
                    <span>Current class: {selectedStudent.class}</span>
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Fields marked with * are required for the receipt payload expected by the backend.
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  Draft Receipt
                </button>
              </div>
            </form>

            {preview && (
              <div className="border-t border-slate-200 bg-slate-50 px-10 py-8">
                <h2 className="text-xl font-semibold text-slate-900">Receipt preview</h2>
                <p className="mt-1 text-sm text-slate-600">Verify the details before hooking up the submit action.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Student</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.student}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Academic Year</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.academicYear}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Class</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.class}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Amount</span>
                    <p className="mt-1 text-base font-medium text-emerald-600">INR {preview.amount}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Payment Mode</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.paymentMode}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Payment Date</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.paymentDate}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow md:col-span-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Remarks</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.remarks}</p>
                  </div>
                </div>
              <button
                onClick={createReceipt}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  create Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateReceipt