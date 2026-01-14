import React from 'react'
import { useState } from 'react'

function Students() {
  const [year, setYear] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [name, setName] = useState("")
  const [student, setStudent] = useState([])

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (year) params.append("year", year);
    if (studentClass) params.append("class", studentClass);
    if (name) params.append("name", name);

    const endpoint = name ? "/student" : "/student/get";

    try{
      const res = await fetch(`http://localhost:8000${endpoint}?${params.toString()}`)
      const data = await res.json()
      if(!res.ok) {
        setStudent([])
        return;
      }
      setStudent(Array.isArray(data.data) ? data.data : []);
    } catch(e) {
      setStudent([]);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 text-center">Student List</h2>
            <p className="text-sm text-gray-500 mt-1 text-center">Filter by year and class</p>
          </div>

          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              >
                <option value="">Academic Year</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
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
                type='text'
                placeholder='Enter Student Name'
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
                  <th className="w-24 px-4 py-2 text-cente text-sm font-semibold text-gray-700 bg-amber-100 ">S.No</th>
                  <th className="px-4 py-2 text-ceter text-sm font-semibold text-gray-700 bg-amber-200">Name</th>
                  <th className="w-36 px-4 py-2 text-cener text-sm font-semibold text-gray-700 bg-amber-300">Class</th>
                  <th className="px-4 py-2 text-ceter text-sm font-semibold text-gray-700 bg-amber-400">Parent Name</th>
                  <th className="w-52 px-4 py-2 text-centr text-sm font-semibold text-gray-700 bg-amber-500">Academic Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {student.length > 0 && student.map((item, idx) => (
                  <tr key={item.studentId ?? idx} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-2 text-gray-900">{item.full_name}</td>
                    <td className="px-4 py-2 text-gray-700">{item.class}</td>
                    <td className="px-4 py-2 text-gray-700">{item.parent_name ? item.parent_name : '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{item.year_name}</td>
                  </tr>
                ))}

                {student.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                      No students found. Adjust filters and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Students