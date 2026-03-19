import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';

const classOptions = ['7th', '8th', '9th', '10th', '11th', '12th']
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobileRegex = /^\d{10}$/

function CreateStudent() {

    const location = useLocation();
    const navigate = useNavigate();
  const outletContext = useOutletContext()
  const refreshStudents = outletContext?.refreshStudents
    
    const isModalOpen = location.pathname === "/students/create"

    if(!isModalOpen){
        return null;
    }

    const [isCreating, setIscreating] = useState(false)
    const [preview, setPreview] = useState(null)
    const [submitError, setSubmitError] = useState('')
    const [errors, setErrors] = useState({})
    const previewRef = useRef(null)
    const [formData, setFormData] = useState({
        academicYears: '',
        studentClass: '',
        studentName: '',
        mobNumber: '',
        email: '',
        totalAmount: '',
        parentName: '',
    })

    const createStudent = async() => {
      setSubmitError('')
        try {
          setIscreating(true);
            const payload = {
                name: formData.studentName,
                email: formData.email,
                mobile: formData.mobNumber,
                parentName: formData.parentName,
                class: formData.studentClass,
                totalFee: formData.totalAmount
            }

            const res = await fetch(`${process.env.API_URL}/student/create`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const responsePayload = await res.json().catch(() => null)
            if (!res.ok) {
              throw new Error(responsePayload?.message || 'Failed to create student')
            }

            if (typeof refreshStudents === 'function') {
              await refreshStudents()
            }

            navigate("/students", { replace:true });

        } catch (error) {
            setSubmitError(error.message || 'Failed to create student')
        } finally {
          setIscreating(false)
        }
    }

    const validate = () => {
        const nextErrors = {}
        if (!formData.studentName) nextErrors.studentName = 'Enter student name'
        if (!formData.studentClass) nextErrors.studentClass = 'Select class'
        if (!formData.mobNumber) {
          nextErrors.mobNumber = 'Enter mobile number'
        } else if (!mobileRegex.test(String(formData.mobNumber).trim())) {
          nextErrors.mobNumber = 'Mobile number must be exactly 10 digits'
        }

        if (!formData.email) {
          nextErrors.email = 'Enter email'
        } else if (!emailRegex.test(String(formData.email).trim())) {
          nextErrors.email = 'Enter a valid email address'
        }
        if (!formData.totalAmount) nextErrors.totalAmount = 'Enter fee'
        if (!formData.parentName) nextErrors.parentName = 'Enter parent name'
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

        const studentDraft = {
            student: formData.studentName,
            class: formData.studentClass,
            mobile: formData.mobNumber,
            email: formData.email,
            totalAmount: formData.totalAmount,
            parentName: formData.parentName
        }

        setPreview(studentDraft)
    }

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

    const handleClose = () => {
        navigate('/students', { replace: true })
    }

  return (
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl">
          <div className="app-modal-panel max-h-[95vh] sm:max-h-[88vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-col gap-1 sm:gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 bg-linear-to-r from-sky-50 to-blue-50 p-2 sm:p-6">
              <div>
                <h1 className="text-lg sm:text-3xl font-semibold text-slate-900">Create Student</h1>
              <p className="hidden sm:block mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600">
                Add the core student details and review them before creating the record.
              </p>
              </div>
              <button 
                className='mt-1 sm:mt-0 rounded-lg sm:rounded-xl bg-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 whitespace-nowrap'
                onClick={handleClose}
              >Close</button>
            </div>

            <form onSubmit={handleSubmit} className="p-2 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">

                <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Student name<span className="text-rose-500">*</span></span>
                  <input
                  type='text'
                    name="studentName"
                    placeholder='Enter Student name'
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  {errors.studentName && <span className="text-xs font-medium text-rose-500">{errors.studentName}</span>}
                </label>

                <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Parent name<span className="text-rose-500">*</span></span>
                  <input
                    type='text'
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder="Enter parent name"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.parentName && <span className="text-xs font-medium text-rose-500">{errors.parentName}</span>}
                </label>

                <label className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Class<span className="text-rose-500">*</span></span>
                  <select
                    name="studentClass"
                    value={formData.studentClass}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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

                <label className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Mobile number<span className="text-rose-500">*</span></span>
                  <input
                    type="tel"
                    name="mobNumber"
                    placeholder="Enter mobile number"
                    value={formData.mobNumber}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={10}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.mobNumber && <span className="text-xs font-medium text-rose-500">{errors.mobNumber}</span>}
                </label>

                <label className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">email<span className="text-rose-500">*</span></span>
                  <input
                    type='email'
                    name="email"
                    placeholder='Enter Email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.email && <span className="text-xs font-medium text-rose-500">{errors.email}</span>}
                </label>

                <label className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">total Amount<span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    name="totalAmount"
                    placeholder='Enter total Fee'
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.totalAmount && <span className="text-xs font-medium text-rose-500">{errors.totalAmount}</span>}
                </label>

              </div>

              <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs text-slate-500">
                  Fields marked with * are required.
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-lg sm:rounded-xl bg-blue-600 px-4 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Draft Student
                </button>
              </div>
            </form>

            {preview && (
              <div ref={previewRef} className="app-fade-in border-t border-slate-200 bg-slate-50 p-3 sm:p-6 md:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Student preview</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">Verify the details before saving.</p>
                <div className="mt-4 sm:mt-6 grid gap-2 sm:gap-4 md:grid-cols-2 grid-cols-1">
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Student</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-900">{preview.student}</p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Class</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-900">{preview.class}</p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Parent Name</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-900">{preview.parentName}</p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">mobile</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-900">{preview.mobile}</p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">email</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-900">{preview.email}</p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-5 py-3 sm:py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">totalAmount</span>
                    <p className="mt-1 text-sm sm:text-base font-medium text-emerald-600">INR {preview.totalAmount}</p>
                  </div>
                </div>
                {submitError && (
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-rose-600">{submitError}</p>
                )}
                <button
                onClick={createStudent}
                disabled={isCreating}
                className="mt-4 sm:mt-6 w-full rounded-lg sm:rounded-xl bg-emerald-600 px-4 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isCreating ? "Creating..." : "Create Student"}
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}

export default CreateStudent