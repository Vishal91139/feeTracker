import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, setStoredAdmin } from '../../utils/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAdminAuthenticated()) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please enter email and password')
      return
    }

    try {
      setError('')
      setIsSubmitting(true)

      const response = await fetch(`${process.env.API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password
        })
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok || !payload?.data) {
        setError(payload?.message || 'Login failed. Please check your credentials.')
        return
      }

      setStoredAdmin(payload.data)
      navigate('/', { replace: true })
    } catch {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.2),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.18),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_45%,#f8fafc_100%)]" aria-hidden="true" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden bg-linear-to-br from-cyan-600 via-sky-600 to-blue-700 p-10 text-white lg:block">
          <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">Fee Tracker</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">School fee operations, simplified for every session.</h1>
          <p className="mt-4 max-w-sm text-sm text-cyan-100">Track students, receipts, and academic years from one responsive workspace built for desktop and mobile teams.</p>
        </section>

        <section className="p-6 sm:p-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Admin Login</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your dashboard.</p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleLogin}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Login