import React from 'react'
import { useState } from 'react'

function Students() {
  const [year, setYear] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [student, setStudent] = useState([])

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (year) params.append("year", year);
    if (studentClass) params.append("class", studentClass);

    const response = await fetch(
      `http://localhost:8000/student/get?${params.toString()}`
    ).then(res => res.json())
    .then(data => setStudent(data.data))
  };

  return (
    <>
    <div className='w-full h-screen bg-blue-200'>
      <p className='text-center p-20 text-4xl'>Student List</p>
      <div className='flex justify-center gap-8'>
        <select 
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150">
          <option value="">Academic Year</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2023-2024">2023-2024</option>
        </select>
        <select 
        value={studentClass}
        onChange={(e) => setStudentClass(e.target.value)}
        className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150">
          <option value="">Class</option>
          <option value="7th">7th</option>
          <option value="8th">8th</option>
          <option value="9th">9th</option>
          <option value="10th">10th</option>
          <option value="11th">11th</option>
          <option value="12th">12th</option>
        </select>
        <input type='text' placeholder='Enter Student Name' className="w-2xs bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" />
        <button
        onClick={handleSearch}
        className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">Search</button>
      </div>
      <div className='flex flex-col items-center gap-4 m-10'>
        {
          student.map((item, index) => (
            <div key={index}>
              {item.full_name}
            </div>
          ))
        }
      </div>
    </div>
    </>
  )
}

export default Students