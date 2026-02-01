import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';

const classOptions = ['7th', '8th', '9th', '10th', '11th', '12th']

function CreateStudent() {

    const location = useLocation();
    const navigate = useNavigate();
    
    const isModalOpen = location.pathname === "/students/create"

    const [academicYears, setAcademicYears] = useState([])
    const [isYearLoading, setIsYearLoading] = useState(false)
    const [preview, setPreview] = useState(null)
    const [errors, setErrors] = useState({})
    const [formData, setFormData] = useState({
        academicYears: '',
        studentClass: '',
        studentName: '',
        mobNumber: '',
        email: '',
        totalAmount: '',
        parentName: '',
    })

    const createReceipt = async() => {
        try {
            const payload = {
                name: formData.studentName,
                email: formData.email,
                mobile: formData.mobNumber,
                parentName: formData.parentName,
                studentClass: formData.studentClass,
                totalFees: formData.totalAmount
            }

            const res = await fetch("http://localhost:8000/student/create", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log(data)
        } catch (error) {
            alert("student already exist")
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

    const validate = () => {
        const nextErrors = {}
        if (!formData.studentName) nextErrors.studentName = 'Enter student name'
        if (!formData.studentClass) nextErrors.studentClass = 'Select class'
        if (!formData.academicYears) nextErrors.academicYears = 'Select academic year'
        if (!formData.mobNumber) nextErrors.mobNumber = 'Enter mobile number'
        if (!formData.email) nextErrors.email = 'Enter email'
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

        const studentDraft = {
            student: formData.studentName,
            class: formData.studentClass,
            academicYear: formData.academicYears,
            mobile: formData.mobNumber,
            email: formData.email,
            totalAmount: formData.totalAmount,
            parentName: formData.parentName
        }

        setPreview(studentDraft)
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target
        setFormData((previous) => ({ ...previous, [name]: value }))
        setErrors((previous) => ({ ...previous, [name]: '' }))
    }

    const handleClose = () => {
        navigate('/students', { replace: true })
    }

    if(!isModalOpen){
        return null;
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
              <h1 className="text-3xl font-semibold text-slate-900">Create Student</h1>
              <p className="mt-2 text-sm text-slate-600">
                Fill every required field to draft a receipt. Submission wiring can be added once API integration is ready.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-10 py-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Academic Year<span className="text-rose-500">*</span></span>
                  <select
                    name="academicYears"
                    value={formData.academicYears}
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
                  {errors.academicYears && <span className="text-xs font-medium text-rose-500">{errors.academicYears}</span>}
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
                  <input
                  type='text'
                    name="studentName"
                    placeholder='Enter Student name'
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  {errors.studentName && <span className="text-xs font-medium text-rose-500">{errors.studentName}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Amount<span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    name="mobNumber"
                    placeholder="Enter mobile number"
                    value={formData.mobNumber}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.mobNumber && <span className="text-xs font-medium text-rose-500">{errors.mobNumber}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">email<span className="text-rose-500">*</span></span>
                  <input
                    type='email'
                    name="email"
                    placeholder='Enter Email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.email && <span className="text-xs font-medium text-rose-500">{errors.email}</span>}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">total Amount<span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    name="totalAmount"
                    placeholder='Enter total Fee'
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.totalAmount && <span className="text-xs font-medium text-rose-500">{errors.totalAmount}</span>}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Parent name</span>
                  <input
                    type='text'
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder="Notes about this payment"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.parentName && <span className="text-xs font-medium text-rose-500">{errors.parentName}</span>}
                </label>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Fields marked with * are required for the receipt payload expected by the backend.
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  Draft Student
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
                    <span className="text-xs uppercase tracking-wide text-slate-400">mobile</span>
                    <p className="mt-1 text-base font-medium text-emerald-600">INR {preview.mobile}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">email Mode</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.email}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow">
                    <span className="text-xs uppercase tracking-wide text-slate-400">totalAmount Date</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.totalAmount}</p>
                  </div>
                  <div className="rounded-xl bg-white px-5 py-4 shadow md:col-span-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">RemaparentNamerks</span>
                    <p className="mt-1 text-base font-medium text-slate-900">{preview.parentName}</p>
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

export default CreateStudent