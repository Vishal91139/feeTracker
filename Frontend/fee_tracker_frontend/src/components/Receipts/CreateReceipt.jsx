import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';

const classOptions = ['7th', '8th', '9th', '10th', '11th', '12th']
const paymentModes = ['CASH', 'CHEQUE', 'UPI', 'BANK', 'CARD']

function CreateReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const outletContext = useOutletContext()
  const refreshReceipts = outletContext?.refreshReceipts
  
  const isModalOpen = location.pathname === "/receipts/create"

  const [academicYears, setAcademicYears] = useState([])
  const [students, setStudents] = useState([])
  const [isYearLoading, setIsYearLoading] = useState(false)
  const [isStudentLoading, setIsStudentLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [preview, setPreview] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [studentInput, setStudentInput] = useState('')
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false)
  const previewRef = useRef(null)
  const [formData, setFormData] = useState({
    academicYearId: '',
    studentClass: '',
    studentId: '',
    amount: '',
    paymentMode: '',
    paymentDate: '',
    remarks: '',
  })

  const isEnabledFlag = (value) => value === true || Number(value) === 1

  const createReceipt = async() => {
    setSubmitError('')
    setIsCreating(true)

    try {
      const payload = {
        academicYearId: formData.academicYearId,
        studentClass: formData.studentClass,
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

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to create receipt')
      }

      if (typeof refreshReceipts === 'function') {
        await refreshReceipts()
      }

      navigate('/receipts', { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Failed to create receipt')
    } finally {
      setIsCreating(false)
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
        const years = Array.isArray(payload.data) ? payload.data : []
        setAcademicYears(years)

        const currentYear = years.find((item) => isEnabledFlag(item.is_current))
        if (currentYear) {
          setFormData((previous) => ({ ...previous, academicYearId: String(currentYear.id) }))
        }
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
      setStudentInput('')
      setIsStudentDropdownOpen(false)
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

  useEffect(() => {
    if (!preview || !previewRef.current) {
      return
    }

    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [preview])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.studentId) === String(formData.studentId)) ?? null,
    [students, formData.studentId],
  )

  const studentChoices = useMemo(
    () => students.map((item) => ({
      id: String(item.studentId),
      label: `${item.full_name}`,
    })),
    [students],
  )

  const matchingStudentChoices = useMemo(() => {
    const query = studentInput.trim().toLowerCase()
    if (!query) return studentChoices
    return studentChoices.filter((choice) => choice.label.toLowerCase().includes(query))
  }, [studentChoices, studentInput])

  const selectStudentChoice = (choice) => {
    if (!choice) return
    setStudentInput(choice.label)
    setFormData((previous) => ({ ...previous, studentId: choice.id }))
    setErrors((previous) => ({ ...previous, studentId: '' }))
    setIsStudentDropdownOpen(false)
  }

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

    setSubmitError('')

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
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-5xl px-4">
          <div className="app-modal-panel flex max-h-[88vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="shrink-0 flex items-start justify-between border-b border-slate-200 bg-linear-to-r from-emerald-50 to-cyan-50 px-8 py-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Create Receipt</h1>
              <p className="mt-2 text-sm text-slate-600">
                Fill the payment details and verify the preview before saving.
              </p>
              </div>
              <button 
                className='rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100'
                onClick={handleClose}
              >Close</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">

            <form onSubmit={handleSubmit} className="px-8 py-8 md:px-10">
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
                  <div className="relative">
                    <input
                      type="text"
                      value={studentInput}
                      onChange={(event) => {
                        const typedValue = event.target.value
                        setStudentInput(typedValue)
                        setFormData((previous) => ({ ...previous, studentId: '' }))
                        setErrors((previous) => ({ ...previous, studentId: '' }))
                        setIsStudentDropdownOpen(true)
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      onBlur={() => {
                        const exactMatch = studentChoices.find(
                          (choice) => choice.label.toLowerCase() === studentInput.trim().toLowerCase(),
                        )
                        if (exactMatch) {
                          setFormData((previous) => ({ ...previous, studentId: exactMatch.id }))
                          setErrors((previous) => ({ ...previous, studentId: '' }))
                        }

                        setTimeout(() => {
                          setIsStudentDropdownOpen(false)
                        }, 120)
                      }}
                      disabled={!formData.studentClass || !formData.academicYearId || isStudentLoading}
                      placeholder={isStudentLoading ? 'Loading students...' : 'Search and select student'}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    {isStudentDropdownOpen && !isStudentLoading && matchingStudentChoices.length > 0 && (
                      <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        {matchingStudentChoices.map((choice) => {
                          const studentItem = students.find((item) => String(item.studentId) === choice.id)
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                selectStudentChoice(choice)
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-100"
                            >
                              <p className="text-sm font-medium text-slate-900">{studentItem?.full_name ?? choice.label}</p>
                              <p className="text-xs text-slate-500">
                                Parent: {studentItem?.parent_name ?? '-'} | Due: {studentItem?.due_amount ?? 0}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {errors.studentId && <span className="text-xs font-medium text-rose-500">{errors.studentId}</span>}
                  {!errors.studentId && !isStudentLoading && formData.studentClass && formData.academicYearId && students.length === 0 && (
                    <span className="text-xs text-amber-600">No students found for the chosen class and academic year.</span>
                  )}
                  {!errors.studentId && !isStudentLoading && students.length > 0 && studentInput.trim() && matchingStudentChoices.length === 0 && (
                    <span className="text-xs text-amber-600">No students match your search.</span>
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
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Draft Receipt
                </button>
              </div>
            </form>

            {preview && (
              <div ref={previewRef} className="app-fade-in border-t border-slate-200 bg-slate-50 px-8 py-8 md:px-10">
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
              {submitError && (
                <p className="mt-4 text-sm font-medium text-rose-600">{submitError}</p>
              )}
              <button
                onClick={createReceipt}
                disabled={isCreating}
                className="mt-6 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300">
                  {isCreating ? 'Creating...' : 'Create Receipt'}
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