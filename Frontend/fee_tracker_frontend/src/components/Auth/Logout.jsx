import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredAdmin } from '../../utils/auth'

function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    const logout = async () => {
      clearStoredAdmin()

      try {
        await fetch(`${process.env.API_URL}/admin/logout`, {
          method: 'POST'
        })
      } catch {
        // Ignore logout API failures because local session is already cleared.
      }

      navigate('/login', { replace: true })
    }

    logout()
  }, [navigate])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(14,165,233,0.15),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f1f5f9_60%,#eef2ff_100%)]" aria-hidden="true" />
      <div className="relative inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 shadow-md">
        <span className="app-spinner" aria-hidden="true" />
        Logging out...
      </div>
    </div>
  )
}

export default Logout
