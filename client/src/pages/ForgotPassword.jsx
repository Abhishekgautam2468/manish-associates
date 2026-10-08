import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react'
import AuthAside from '../components/AuthAside.jsx'
import { api } from '../api.js'

const STEPS = { email: 1, code: 2, password: 3 }

function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const headingRef = useRef(null)

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function run(action) {
    setSending(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const requestCode = () =>
    run(async () => {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setCode('')
      setResendIn(data.resendAfterSeconds)
      setStep('code')
    })

  function handleEmail(event) {
    event.preventDefault()
    requestCode()
  }

  function handleCode(event) {
    event.preventDefault()
    run(async () => {
      try {
        const data = await api('/auth/verify-otp', { method: 'POST', body: { email, code } })
        setResetToken(data.resetToken)
        setStep('password')
      } catch (err) {
        setCode('')
        throw err
      }
    })
  }

  function handlePassword(event) {
    event.preventDefault()
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }
    run(async () => {
      try {
        await api('/auth/reset-password', { method: 'POST', body: { resetToken, password } })
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (err.status === 400 && err.message.startsWith('This reset has expired')) {
          setStep('email')
        }
        throw err
      }
    })
  }

  const errorText = error && (
    <p className="notice notice--error" role="alert">
      {error}
    </p>
  )

  return (
    <main className="auth">
      <AuthAside />
      <div className="auth__main">
        <div className="auth__card">
          <div className="steps" role="img" aria-label={`Step ${STEPS[step]} of 3`}>
            {Object.keys(STEPS).map((key) => (
              <span key={key} className="steps__dot" data-active={STEPS[key] <= STEPS[step]} />
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={handleEmail}>
              <span className="auth__icon" aria-hidden="true">
                <KeyRound size={20} />
              </span>
              <h1 className="auth__title" tabIndex={-1} ref={headingRef}>
                Reset your password
              </h1>
              <p className="auth__hint">Enter the email address on the account and we’ll send you a 6-digit code.</p>
              <div className="auth__fields">
                <div>
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="field"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errorText}
              </div>
              <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCode}>
              <span className="auth__icon" aria-hidden="true">
                <MailCheck size={20} />
              </span>
              <h1 className="auth__title" tabIndex={-1} ref={headingRef}>
                Check your email
              </h1>
              <p className="auth__hint">
                If <strong>{email}</strong> is the account email, a code is on its way. It expires in 10 minutes.
              </p>
              <div className="auth__fields">
                <div>
                  <label className="label" htmlFor="code">
                    6-digit code
                  </label>
                  <input
                    id="code"
                    className="field field--code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                {errorText}
              </div>
              <button className="btn btn--primary btn--block" type="submit" disabled={sending || code.length !== 6}>
                {sending ? 'Checking…' : 'Verify code'}
              </button>
              <div className="auth__links">
                <button type="button" className="text-button" onClick={requestCode} disabled={sending || resendIn > 0}>
                  {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setError('')
                    setStep('email')
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePassword}>
              <span className="auth__icon" aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <h1 className="auth__title" tabIndex={-1} ref={headingRef}>
                Choose a new password
              </h1>
              <p className="auth__hint">Use at least 8 characters. Changing it signs you out on every other device.</p>
              <div className="auth__fields">
                <div>
                  <label className="label" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    className="field"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    className="field"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Type it again"
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                {errorText}
              </div>
              <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
                {sending ? 'Saving…' : 'Save password and sign in'}
              </button>
            </form>
          )}
        </div>

        <Link to="/login" className="auth__back">
          <ArrowLeft size={15} aria-hidden="true" /> Back to sign in
        </Link>
      </div>
    </main>
  )
}

export default ForgotPassword
