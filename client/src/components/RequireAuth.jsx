import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api.js'

// Renders children(user) once the session is confirmed.
function RequireAuth({ children }) {
  const [state, setState] = useState({ status: 'checking', user: null })

  useEffect(() => {
    api('/auth/me')
      .then((user) => setState({ status: 'signed-in', user }))
      .catch(() => setState({ status: 'signed-out', user: null }))
  }, [])

  if (state.status === 'checking') return <p className="page-status">Checking your session…</p>
  if (state.status === 'signed-out') return <Navigate to="/login" replace />
  return children(state.user)
}

export default RequireAuth
