import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

const paymentModes = ['Cash', 'Cheque', 'UPI', 'Bank Transfer', 'Card']

function EditReceipt() {
  const navigate = useNavigate()
  const { receiptId } = useParams()
  const { refreshReceipts } = useOutletContext()

  const [formData, setFormData] = useState({
    amount: '',
    paymentMode: '',
    paymentDate: '',
    remarks: '',
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadReceipt = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`http://localhost:8000/receipt/${receiptId}`)
        const payload = await res.json()

        if (!res.ok) {
          throw new Error(payload?.message || 'Failed to load receipt')
        }

        if (!ignore) {
          setFormData({
            amount: payload.data?.amount ?? '',
            paymentMode: payload.data?.payment_mode ?? '',
            paymentDate: payload.data?.payment_date ? new Date(payload.data.payment_date).toISOString().split('T')[0] : '',
            remarks: payload.data?.remarks ?? '',
          })
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Failed to load receipt')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadReceipt()

    return () => {
      ignore = true
    }
  }, [receiptId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      setError('')

      const res = await fetch(`http://localhost:8000/receipt/${receiptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to update receipt')
      }

      refreshReceipts()
      navigate(`/receipts/${receiptId}`, { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'Failed to update receipt')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-linear-to-r from-amber-50 to-orange-50 px-8 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Edit Receipt</h2>
            <p className="mt-1 text-sm text-slate-500">Update the receipt payment information.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/receipts', { replace: true })}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-8 py-8">
          {loading && <p className="text-sm text-slate-500">Loading receipt details...</p>}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}

          {!loading && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Amount</span>
                <input
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Payment Mode</span>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select mode</option>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Payment Date</span>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Remarks</span>
                <textarea
                  rows={4}
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/receipts/${receiptId}`, { replace: true })}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSaving}
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditReceipt