import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { isAdminAuthenticated } from '../../utils/auth'

function ProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
