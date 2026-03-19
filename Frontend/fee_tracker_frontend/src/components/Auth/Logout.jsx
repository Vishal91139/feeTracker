import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredAdmin } from '../../utils/auth'

function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    const logout = async () => {
      clearStoredAdmin()

      try {
        await fetch('http://localhost:8000/admin/logout', {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-slate-700 shadow-sm">
        Logging out...
      </div>
    </div>
  )
}

export default Logout
