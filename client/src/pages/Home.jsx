import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Hammer, LogIn } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { api } from '../api.js'

function Home() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    setState({ status: 'sending', message: '' })
    try {
      await api('/subscribe', { method: 'POST', body: { email } })
      setState({ status: 'done', message: `Done. We'll email ${email.trim()} when the site is live.` })
      setEmail('')
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  return (
    <div className="site">
      <header className="site__head">
        <Logo />
        <Link to="/login" className="btn btn--ghost btn--sm">
          <LogIn size={16} aria-hidden="true" /> Sign in
        </Link>
      </header>

      <main className="site__main">
        <h1 className="site__name">
          <span>Manish</span>
          <span>Associates</span>
        </h1>

        <p className="site__status">
          <Hammer size={15} aria-hidden="true" /> New website coming soon
        </p>
        <p className="site__lede">
          We’re putting the finishing touches on it. Leave your email and we’ll tell you the day it goes live.
        </p>

        {state.status === 'done' ? (
          <p className="notice notice--done" role="status">
            <CheckCircle2 size={18} aria-hidden="true" /> {state.message}
          </p>
        ) : (
          <form className="notify" onSubmit={handleSubmit} noValidate>
            <label className="visually-hidden" htmlFor="notify-email">Email address</label>
            <input
              id="notify-email"
              className="field"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state.status === 'error'}
              aria-describedby={state.status === 'error' ? 'notify-error' : undefined}
              required
            />
            <button className="btn btn--primary" type="submit" disabled={state.status === 'sending'}>
              {state.status === 'sending' ? 'Saving…' : 'Notify me'}
            </button>
            {state.status === 'error' && (
              <p id="notify-error" className="notice notice--error" role="alert">
                {state.message}
              </p>
            )}
          </form>
        )}
      </main>

      <footer className="site__foot">
        <span>© {new Date().getFullYear()} Manish Associates</span>
      </footer>
    </div>
  )
}

export default Home
