import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import Logo from './Logo.jsx'

// The brand panel beside the sign-in and password-reset forms. A side column on wide screens, a top band on phones.
const SERVICES = [
  { icon: ArrowDownLeft, name: 'Cash withdrawal', text: 'Paid by UPI, given in cash' },
  { icon: ArrowUpRight, name: 'Money transfer', text: 'Cash in, sent to their account' },
  { icon: ArrowLeftRight, name: 'Balances', text: 'Who owes you, and whom you owe' },
]

function AuthAside() {
  return (
    <aside className="auth__aside">
      <span className="auth__rupee" aria-hidden="true">
        ₹
      </span>
      <Logo size="lg" />
      <div className="auth__pitch">
        <p className="auth__headline">
          Every rupee in.
          <br />
          Every rupee out.
        </p>
        <ul className="auth__services">
          {SERVICES.map(({ icon: Icon, name, text }) => (
            <li key={name}>
              <span className="auth__service-icon" aria-hidden="true">
                <Icon size={17} strokeWidth={2.25} />
              </span>
              <span>
                <strong>{name}</strong>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="auth__private">Private dashboard for the owner only</p>
    </aside>
  )
}

export default AuthAside
