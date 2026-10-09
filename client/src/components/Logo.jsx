// The Manish Associates logo. `onLight` picks the version with dark lettering, for white paper and light pages.
const HEIGHT = { sm: 38, md: 44, lg: 52 }

function Logo({ size = 'md', showName = true, onLight = false }) {
  const h = HEIGHT[size] ?? HEIGHT.md
  if (!showName) {
    return (
      <span className="logo">
        <img src="/brand/mark-192.png" width={h} height={h} alt="Manish Associates" style={{ display: 'block' }} />
      </span>
    )
  }
  const file = onLight ? 'logo-on-light' : 'logo-on-dark'
  return (
    <span className="logo">
      <picture>
        <source type="image/webp" srcSet={`/brand/${file}.webp`} />
        <img
          src={`/brand/${file}.png`}
          height={h}
          width={Math.round((h * 543) / 160)}
          alt="Manish Associates"
          style={{ display: 'block', height: h, width: 'auto' }}
        />
      </picture>
    </span>
  )
}

export default Logo
