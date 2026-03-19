import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const formatDateForDisplay = (value) => {
    if (!value) return '-'

    const textValue = String(value)
    const dateMatch = textValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateMatch) {
        return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`
    }

    const parsed = new Date(textValue)
    if (Number.isNaN(parsed.getTime())) {
        return '-'
    }

    return parsed.toLocaleDateString('en-IN')
}

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
        <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="app-modal-panel w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-50 to-cyan-50 px-8 py-5 print:hidden">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Receipt</h2>
                                <p className="mt-1 text-sm text-slate-500">Review and print receipt details.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className='rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100'
                                    onClick={handleClose}
                                >Close</button>
                                <button className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700'
                                    onClick={printReceipt}
                                >Print</button>
                            </div>
                        </div>
                        <div className="mx-auto max-w-10xl px-1">
                                <div className="bg-slate-50 px-8 py-8 print:w-full print:mx-0 print:bg-white print:p-0">
                    <h2 className="text-xl font-semibold text-slate-900">Receipt</h2>
                    {loading && (
                        <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                            <span className="app-spinner" aria-hidden="true" />
                            Loading receipt...
                        </div>
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
                        <p className="mt-1 text-base font-medium text-slate-900">{formatDateForDisplay(receipt.payment_date)}</p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-4 shadow md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Remarks</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.remarks ?? '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  )
}

export default ViewReceipt