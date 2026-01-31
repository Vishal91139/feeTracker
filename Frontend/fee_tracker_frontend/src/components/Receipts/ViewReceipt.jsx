import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function ViewReceipt() {
    const navigate = useNavigate();

    const { receiptId } = useParams()
    const [receipt, setReceipt] = useState({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadReceipt = async () => {
            if (!receiptId) {
                setError('Missing receipt id')
                setLoading(false)
                return
            }
            try {
                const res = await fetch(`http://localhost:8000/receipt/${receiptId}`)
                const data = await res.json()
                if (!res.ok) {
                    setError(data?.message || 'Failed to fetch receipt')
                    setReceipt({})
                    setLoading(false)
                    return
                }
                setReceipt(data?.data ?? {})
                setError('')
            } catch (err) {
                setError('Network error fetching receipt')
                setReceipt({})
            } finally {
                setLoading(false)
            }
        }

        loadReceipt()
    }, [receiptId])

    const handleClose = () => {
        navigate('/receipts', { replace: true })
    }

    const printReceipt = () => {
    window.print();
    };


  return (
    <>
    <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center">
        <div className="bg-slate-950 py-1">
            <button className='px-7 py-4 bg-red-500 rounded-2xl print:hidden'
            onClick={handleClose}
            >Close</button>
            <div className="mx-auto max-w-10xl px-1">
                <div className="border-t border-slate-200 bg-slate-50 px-10 py-8 print:w-full print:mx-0 print:p-0">
                    <h2 className="text-xl font-semibold text-slate-900">Receipt</h2>
                    {loading && (
                        <p className="mt-2 text-sm text-slate-500">Loading receipt...</p>
                    )}
                    {!loading && error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Student</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.full_name ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Academic Year</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.year_name ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Class</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.class ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Amount</span>
                        <p className="mt-1 text-base font-medium text-emerald-600">INR {receipt.amount ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Payment Mode</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.payment_mode ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Payment Date</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString('en-IN') : '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Remarks</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.remarks ?? '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <button className='px-7 py-4 bg-blue-400 rounded-2xl print:hidden'
            onClick={printReceipt}
            >Print</button>
        </div>
    </div>
    </>
  )
}

export default ViewReceipt