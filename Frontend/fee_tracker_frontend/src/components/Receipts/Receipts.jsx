import React from 'react'
import { useState } from 'react'

function Receipts() {

  const [receipt, setReceipt] = useState([])

  const handleSearch = async () => {
    const response = await fetch(
      `http://localhost:8000/receipt`
    ).then(res => res.json())
    .then(data => setReceipt(data.data))
  }

  return (
    <>
    <div className='w-full h-screen bg-blue-200'>
      <p className='text-center p-20 text-4xl'>Receipts List</p>
      <div className='flex justify-center gap-8'>
        <select className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"></select>
        <select className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"></select>
        <input type='text' placeholder='Enter Student Name' className="w-2xs bg-gray-100 text-gray-900 border-0 rounded-md p-2 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" />
        <button 
        onClick={handleSearch}
        className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">Search</button>
      </div>
      <div className='flex flex-col items-center gap-4 m-10'>
        {
          receipt.map((item, index) => (
            <p key={index}>
              {item.receipt_number}
            </p>
          ))
        }
      </div>
    </div>
    </>
  )
}

export default Receipts