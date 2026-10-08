import { Building2 } from 'lucide-react'

function Logo({ size = 'md', showName = true }) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
  return (
    <span className={`logo logo--${size}`}>
      <span className="logo__mark" aria-hidden="true">
        <Building2 size={iconSize} strokeWidth={2.25} />
      </span>
      {showName ? <span className="logo__name">Manish Associates</span> : <span className="visually-hidden">Manish Associates</span>}
    </span>
  )
}

export default Logo
