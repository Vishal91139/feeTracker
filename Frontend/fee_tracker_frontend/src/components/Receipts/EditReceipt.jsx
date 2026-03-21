import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'

const paymentModes = ['CASH', 'CHEQUE', 'UPI', 'BANK', 'CARD']

const toDateInputValue = (value) => {
  if (!value) return ''

  const textValue = String(value)
  const directMatch = textValue.match(/^(\d{4}-\d{2}-\d{2})$/)
  if (directMatch) {
    return directMatch[1]
  }

  const parsed = new Date(textValue)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
        const res = await fetch(`${process.env.API_URL}/receipt/${receiptId}`)
        const payload = await res.json()

        if (!res.ok) {
          throw new Error(payload?.message || 'Failed to load receipt')
        }

        if (!ignore) {
          setFormData({
            amount: payload.data?.amount ?? '',
            paymentMode: payload.data?.payment_mode ?? '',
            paymentDate: toDateInputValue(payload.data?.payment_date),
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

      const res = await fetch(`${process.env.API_URL}/receipt/${receiptId}`, {
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
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="app-modal-panel w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-linear-to-br from-amber-50 via-orange-50 to-white px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Edit Receipt</h2>
            <p className="mt-1 text-sm text-slate-500">Update payment details for this receipt.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/receipts', { replace: true })}
            className="rounded-xl bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 whitespace-nowrap"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-5 sm:px-8 sm:py-8">
          {loading && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <span className="app-spinner" aria-hidden="true" />
              Loading receipt details...
            </div>
          )}
          {!loading && error && <p className="text-xs sm:text-sm text-rose-600">{error}</p>}

          {!loading && (
            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Amount</span>
                <input
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Payment Mode</span>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select mode</option>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Payment Date</span>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex flex-col gap-1 sm:gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Remarks</span>
                <textarea
                  rows={3}
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(`/receipts/${receiptId}`, { replace: true })}
              className="rounded-xl bg-slate-100 px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-200 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSaving}
              className="h-11 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
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