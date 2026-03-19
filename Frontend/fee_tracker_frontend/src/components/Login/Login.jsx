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

      const response = await fetch('http://localhost:8000/admin/login', {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-800">Admin Login</h2>
        <p className="mb-6 text-center text-sm text-slate-500">Sign in to access the fee tracker dashboard.</p>

        <form className="flex flex-col" onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
            placeholder="Email address"
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none"
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && (
            <p className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-md bg-linear-to-r from-indigo-500 to-blue-500 px-4 py-2 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login