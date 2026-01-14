import React, { useState } from 'react'
import { useEffect } from 'react'

function AcademicYear() {
  useEffect(() => {
    const resp = fetch("http://localhost:8000/academic-year/get")
    .then((res) => res.json())
    .then((data) => {
      setAcademicYear(data.data)
    })
  }, [])

  const [academicYear, setAcademicYear] = useState([])

  return (
    <>
    <div className='w-full h-screen bg-blue-200'>
      <p className='text-center p-20 text-4xl'>Academic years</p>
      <div className='flex justify-center gap-8'>
        <input type='text' placeholder='Enter academic year' className="w-2xs bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" />
        <button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">Search</button>
      </div>
      <div className='flex flex-col items-center gap-4 m-10'>
        {
          academicYear.map(year => (
            <div key={year.id}>
              {year.year_name}
            </div>
          ))
        }
      </div>
    </div>
    </>
  )
}

export default AcademicYear