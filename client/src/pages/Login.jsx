import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import AuthAside from '../components/AuthAside.jsx'
import { api } from '../api.js'

function Login() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    api('/auth/me')
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => {})
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      await api('/auth/login', { method: 'POST', body: { identifier, password } })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <main className="auth">
      <AuthAside />
      <div className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__hint">Sign in with your dashboard username or email.</p>

          <div className="auth__fields">
            <div>
              <label className="label" htmlFor="identifier">
                Username or email
              </label>
              <input
                id="identifier"
                className="field"
                autoComplete="username"
              placeholder="e.g. manish or name@example.com"
                autoCapitalize="none"
                spellCheck="false"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="label-row">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="label-row__link">
                  Forgot password?
                </Link>
              </div>
              <div className="password-field">
                <input
                  id="password"
                  className="field"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
              placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="notice notice--error" role="alert">
                {error}
              </p>
            )}
          </div>

          <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
            {sending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="auth__back">
          <ArrowLeft size={15} aria-hidden="true" /> Back to the website
        </Link>
      </div>
    </main>
  )
}

export default Login
