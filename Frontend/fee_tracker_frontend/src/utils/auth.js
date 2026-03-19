const AUTH_STORAGE_KEY = 'fee_tracker_admin';

export const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export const setStoredAdmin = (admin) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(admin))
}

export const clearStoredAdmin = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const isAdminAuthenticated = () => {
  return !!getStoredAdmin()
}
