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
                const res = await fetch(`${process.env.API_URL}/receipt/${receiptId}`)
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
                const safe = (value) => {
                        const text = String(value ?? '-')
                        return text
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#39;')
                }

                const receiptDate = formatDateForDisplay(receipt.payment_date)
                const remarks = receipt.remarks || 'N/A'

                const frame = document.createElement('iframe')
                frame.setAttribute('aria-hidden', 'true')
                frame.style.position = 'fixed'
                frame.style.right = '0'
                frame.style.bottom = '0'
                frame.style.width = '0'
                frame.style.height = '0'
                frame.style.border = '0'
                document.body.appendChild(frame)

                const doc = frame.contentWindow?.document
                if (!doc) {
                        frame.remove()
                        window.alert('Unable to prepare print view')
                        return
                }

                const html = `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt ${safe(receiptNumber)}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm; }
        html, body { margin: 0; padding: 0; background: #fff; color: #111827; font-family: Arial, sans-serif; }
        .page { width: 190mm; min-height: 277mm; margin: 0 auto; }
        .receipt { border: 0.3mm solid #374151; padding: 6mm; }
        .header { display: flex; justify-content: space-between; gap: 4mm; border-bottom: 0.3mm dashed #9ca3af; padding-bottom: 4mm; }
        .school-name { margin: 0; font-size: 6mm; font-weight: 700; }
        .muted { margin: 1mm 0; font-size: 3.2mm; color: #4b5563; }
        .title { margin: 0; font-size: 3.2mm; text-transform: uppercase; letter-spacing: 0.6mm; font-weight: 700; text-align: right; }
        .meta { margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 6mm; font-size: 3.5mm; }
        table { width: 100%; border-collapse: collapse; margin-top: 4mm; font-size: 3.5mm; }
        th, td { border: 0.25mm solid #9ca3af; padding: 2.2mm; }
        th { background: #f3f4f6; text-align: left; }
        .amount { text-align: right; }
        .remarks { margin-top: 4mm; font-size: 3.5mm; }
        .signatures { margin-top: 16mm; display: flex; justify-content: space-between; gap: 6mm; font-size: 3.5mm; }
        .sign-line { width: 45%; border-top: 0.25mm solid #6b7280; padding-top: 2mm; }
    </style>
</head>
<body>
    <div class="page">
        <div class="receipt">
            <div class="header">
                <div>
                    <h1 class="school-name">Fee Tracker Public School</h1>
                    <p class="muted">School Address Line, City, State</p>
                    <p class="muted">Phone: +91-00000-00000</p>
                </div>
                <div>
                    <p class="title">Fee Receipt</p>
                    <p class="muted"><strong>Receipt No:</strong> ${safe(receiptNumber)}</p>
                    <p class="muted"><strong>Date:</strong> ${safe(receiptDate)}</p>
                </div>
            </div>

            <div class="meta">
                <p><strong>Received From:</strong> ${safe(receipt.full_name)}</p>
                <p><strong>Class:</strong> ${safe(receipt.class)}</p>
                <p><strong>Academic Year:</strong> ${safe(receipt.year_name)}</p>
                <p><strong>Payment Mode:</strong> ${safe(receipt.payment_mode)}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Particular</th>
                        <th class="amount">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tuition / School Fee</td>
                        <td class="amount">${safe(formattedAmount)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Received</strong></td>
                        <td class="amount"><strong>${safe(formattedAmount)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <p class="remarks"><strong>Remarks:</strong> ${safe(remarks)}</p>

            <div class="signatures">
                <p class="sign-line">Parent/Student Signature</p>
                <p class="sign-line" style="text-align:right">Authorized Signature</p>
            </div>
        </div>
    </div>
</body>
</html>`

                doc.open()
                doc.write(html)
                doc.close()

                setTimeout(() => {
                        frame.contentWindow?.focus()
                        frame.contentWindow?.print()
                        setTimeout(() => frame.remove(), 1000)
                }, 250)
    };

    const amountValue = Number(receipt.amount)
    const formattedAmount = Number.isFinite(amountValue)
        ? amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '-'
    const receiptNumber = receipt.receipt_number ?? `RCPT-${receiptId ?? '-'}`


  return (
    <>
        <div className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
            <div className="app-modal-panel my-3 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:my-0 print:max-h-none print:max-w-none print:rounded-none print:shadow-none sm:my-0 sm:rounded-3xl">
                        <div className="no-print flex flex-col gap-3 border-b border-slate-200 bg-linear-to-br from-emerald-50 via-cyan-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Receipt</h2>
                                <p className="mt-1 text-sm text-slate-500">Review and print receipt details.</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button className='rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 sm:px-4 sm:text-sm'
                                    onClick={handleClose}
                                >Close</button>
                                <button className='print rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 sm:px-4 sm:text-sm'
                                    onClick={printReceipt}
                                >Print</button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="no-print bg-slate-50 px-3 py-4 sm:px-8 sm:py-8">
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
                    <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Student</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.full_name ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Academic Year</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.year_name ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Class</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.class ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Amount</span>
                        <p className="mt-1 text-base font-medium text-emerald-600">INR {receipt.amount ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Payment Mode</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.payment_mode ?? '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Payment Date</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{formatDateForDisplay(receipt.payment_date)}</p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 shadow md:col-span-2 sm:px-5 sm:py-4">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Remarks</span>
                        <p className="mt-1 text-base font-medium text-slate-900">{receipt.remarks ?? '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="hidden bg-white px-6 py-6 print:block">
                    <div className="mx-auto max-w-3xl rounded-none border border-slate-400 p-4">
                        <div className="border-b border-dashed border-slate-400 pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Fee Tracker Public School</h2>
                                    <p className="text-xs text-slate-600">School Address Line, City, State</p>
                                    <p className="text-xs text-slate-600">Phone: +91-00000-00000</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fee Receipt</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-900">Receipt No: {receiptNumber}</p>
                                    <p className="text-xs text-slate-700">Date: {formatDateForDisplay(receipt.payment_date)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <p><span className="font-semibold">Received From:</span> {receipt.full_name ?? '-'}</p>
                            <p><span className="font-semibold">Class:</span> {receipt.class ?? '-'}</p>
                            <p><span className="font-semibold">Academic Year:</span> {receipt.year_name ?? '-'}</p>
                            <p><span className="font-semibold">Payment Mode:</span> {receipt.payment_mode ?? '-'}</p>
                        </div>

                        <table className="mt-4 w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-2 py-1.5 text-left">Particular</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 px-2 py-1.5">Tuition / School Fee</td>
                                    <td className="border border-slate-300 px-2 py-1.5 text-right">{formattedAmount}</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="border border-slate-300 px-2 py-1.5 font-semibold">Total Received</td>
                                    <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold">{formattedAmount}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mt-3 text-xs"><span className="font-semibold">Remarks:</span> {receipt.remarks || 'N/A'}</p>

                        <div className="mt-8 grid grid-cols-2 gap-6 text-xs">
                            <p className="border-t border-slate-400 pt-1.5">Parent/Student Signature</p>
                            <p className="border-t border-slate-400 pt-1.5 text-right">Authorized Signature</p>
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