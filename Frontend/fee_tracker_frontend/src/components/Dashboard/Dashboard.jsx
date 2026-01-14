import React from 'react'
import { Link } from 'react-router-dom'

function Dashboard() {
  return (
    <>
    <div className='w-full h-screen bg-blue-200 flex justify-center items-center'>
      <div className='flex gap-10'>
        <Link to='/academic-year' className='p-10 border-2'>
          <p>Academic-Year</p>
        </Link>
        <Link to='/students' className='p-10 border-2 '>
          <p>Students</p>
        </Link>
        <Link to='/receipts' className='p-10 border-2'>
          <p>Receipts</p>
        </Link>
      </div>
    </div>
    </>
  )
}

export default Dashboard