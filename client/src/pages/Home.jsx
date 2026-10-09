import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useScroll, useSpring, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  BookUser,
  Building2,
  Bus,
  Car,
  CheckCircle2,
  Clock,
  FileCheck2,
  Globe,
  HandCoins,
  HeartPulse,
  Landmark,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Phone,
  Plane,
  Receipt,
  ShieldCheck,
  Stamp,
  Store,
  TrainFront,
  TreePalm,
  Umbrella,
  X,
} from 'lucide-react'

/*
 * The public landing page for Manish Associates: one counter for insurance, banking,
 * documents, tickets and tours. Navy, violet and blue, matching the dashboard.
 *
 * Fill in CONTACT below. Until then the page shows clearly marked placeholders,
 * the same way it does for photos.
 */
const CONTACT = {
  phone: '', // e.g. '+91 98xxx xxxxx'
  whatsapp: '', // digits only with country code, e.g. '9198xxxxxxxx'
  address: '', // shop address
  hours: '', // e.g. 'Monday to Saturday, 9:30 am to 8:00 pm'
}

// Unsplash photos (free to use under the Unsplash licence). Swap an id to change a photo.
const PHOTOS = {
  insurance: { id: '1576091160550-2173dba999ef', alt: 'A stethoscope beside a laptop' },
  banking: { id: '1563013544-824ae1b704d3', alt: 'Paying online with a card' },
  documents: { id: '1554224155-6726b3ff858f', alt: 'Forms and a calculator on a desk' },
  travel: { id: '1436491865332-7a61a109cc05', alt: 'The wing of a plane above the clouds' },
  train: { id: '1474487548417-781cb71495f3', alt: 'A train on the tracks' },
  hills: { id: '1506905925346-21bda4d32df4', alt: 'Snow mountains above the clouds' },
  pilgrimage: { id: '1548013146-72479768bada', alt: 'The Taj Mahal through a carved archway' },
  beach: { id: '1507525428034-b723cf961d3e', alt: 'A quiet beach at sunset' },
  international: { id: '1512453979798-5ea266f8880c', alt: 'The Dubai skyline at dusk' },
  handshake: { id: '1521791136064-7986c2920216', alt: 'Two people shaking hands' },
}
const photoUrl = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`

function Photo({ photo, className = '', sizes = '100vw', eager = false }) {
  return (
    <img
      src={photoUrl(photo.id, 1200)}
      srcSet={[480, 800, 1200, 1600].map((w) => `${photoUrl(photo.id, w)} ${w}w`).join(', ')}
      sizes={sizes}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`h-full w-full bg-[radial-gradient(circle_at_30%_20%,#2a2f6b,#121836)] object-cover ${className}`}
    />
  )
}

const SERVICE_GROUPS = [
  {
    id: 'insurance',
    photo: PHOTOS.insurance,
    title: 'Insurance advice',
    blurb: 'Help choosing the right cover, filling the forms and following up on claims.',
    Icon: ShieldCheck,
    tone: 'violet',
    items: [
      { Icon: Umbrella, label: 'Life insurance' },
      { Icon: HeartPulse, label: 'Health insurance' },
      { Icon: Car, label: 'Motor insurance' },
      { Icon: Store, label: 'Shop and home insurance' },
      { Icon: Plane, label: 'Travel insurance' },
    ],
  },
  {
    id: 'banking',
    photo: PHOTOS.banking,
    title: 'Banking and money',
    blurb: 'Everyday banking at the counter, without the queue at the branch.',
    Icon: Landmark,
    tone: 'blue',
    items: [
      { Icon: Banknote, label: 'Cash withdrawal' },
      { Icon: BadgeIndianRupee, label: 'Money transfer' },
      { Icon: Landmark, label: 'Kiosk banking' },
      { Icon: HandCoins, label: 'Loans' },
    ],
  },
  {
    id: 'documents',
    photo: PHOTOS.documents,
    title: 'Documents and registrations',
    blurb: 'We check every paper before it goes in, so applications don’t come back.',
    Icon: FileCheck2,
    tone: 'navy',
    items: [
      { Icon: BookUser, label: 'Passport, normal and Tatkal' },
      { Icon: Globe, label: 'Visa, normal and urgent' },
      { Icon: Receipt, label: 'GST registration' },
      { Icon: Store, label: 'Shop registration' },
      { Icon: Stamp, label: 'Income tax returns (ITR)' },
    ],
  },
  {
    id: 'travel',
    photo: PHOTOS.travel,
    title: 'Tickets and tours',
    blurb: 'Seats booked, Tatkal included, and holidays planned end to end.',
    Icon: TreePalm,
    tone: 'sky',
    items: [
      { Icon: TrainFront, label: 'Train tickets, including Tatkal' },
      { Icon: Plane, label: 'Flight tickets' },
      { Icon: Bus, label: 'Bus tickets' },
      { Icon: Mountain, label: 'Tour packages' },
    ],
  },
]

const TONES = {
  violet: { tile: 'bg-[#efeaff] text-[#5b37f0]', ring: 'hover:ring-[#6d4aff]/40', dot: 'bg-[#6d4aff]' },
  blue: { tile: 'bg-[#e8f0ff] text-[#2456d6]', ring: 'hover:ring-[#2f6bff]/40', dot: 'bg-[#2f6bff]' },
  navy: { tile: 'bg-[#e9ebf4] text-[#141b34]', ring: 'hover:ring-[#141b34]/30', dot: 'bg-[#141b34]' },
  sky: { tile: 'bg-[#e4f4ff] text-[#0b6fb0]', ring: 'hover:ring-[#38a8f0]/40', dot: 'bg-[#38a8f0]' },
}

const TOURS = [
  { title: 'Hill stations', note: 'Shimla, Manali, Mussoorie and more', Icon: Mountain, photo: PHOTOS.hills },
  { title: 'Heritage and pilgrimage', note: 'Agra, Varanasi, Char Dham, Tirupati and more', Icon: Landmark, photo: PHOTOS.pilgrimage },
  { title: 'Beach holidays', note: 'Goa, Kerala, the Andamans and more', Icon: TreePalm, photo: PHOTOS.beach },
  { title: 'International', note: 'Dubai, Thailand, Singapore and more', Icon: Globe, photo: PHOTOS.international },
]

const STEPS = [
  { title: 'Tell us what you need', body: 'Walk in, call or send a WhatsApp message. We tell you the documents and the fee upfront.' },
  { title: 'Share your documents', body: 'Bring the papers or send clear photos. We check everything before anything is submitted.' },
  { title: 'We handle the rest', body: 'We file, book or apply for you and keep you posted until it’s done.' },
]

const PROMISES = ['Fees told before we start', 'Documents checked twice', 'Updates on WhatsApp', 'One counter for everything']

// The tickets that cycle in the hero, like tokens at a service counter.
const TOKENS = [
  { no: '014', label: 'Tatkal train ticket', Icon: TrainFront, tone: 'bg-[#2f6bff]' },
  { no: '015', label: 'Health insurance renewal', Icon: HeartPulse, tone: 'bg-[#6d4aff]' },
  { no: '016', label: 'Passport, Tatkal', Icon: BookUser, tone: 'bg-[#38a8f0]' },
  { no: '017', label: 'GST registration', Icon: Receipt, tone: 'bg-[#8a6bff]' },
  { no: '018', label: 'Cash withdrawal', Icon: Banknote, tone: 'bg-[#2456d6]' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Contact details, or a marked placeholder until they are filled in.
function Detail({ value, placeholder }) {
  if (value) return <span>{value}</span>
  return <span className="rounded-md border border-dashed border-current/40 px-1.5 py-0.5 text-[0.95em] opacity-70">{placeholder}</span>
}

const telHref = CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s+/g, '')}` : '#contact'
const waHref = CONTACT.whatsapp ? `https://wa.me/${CONTACT.whatsapp}` : '#contact'

function BrandMark({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#7b5eff] to-[#2f6bff] text-white shadow-[0_8px_20px_-8px_rgb(109_74_255/0.9)]">
        <Building2 size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className={`text-[17px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-[#0e1325]'}`}>Manish Associates</span>
    </span>
  )
}

/* ---------- Navigation ---------- */

const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#travel', label: 'Tours' },
  { href: '#how', label: 'How it works' },
  { href: '#contact', label: 'Contact' },
]

function TopNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-[#0f1530]/90 shadow-[0_10px_30px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="no-underline" aria-label="Manish Associates, back to top">
          <BrandMark light />
        </a>
        <ul className="m-0 ml-auto hidden list-none items-center gap-1 p-0 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                className="rounded-lg px-3.5 py-2 text-[15px] font-semibold text-white/75 no-underline transition-colors hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={waHref}
          className="ml-auto hidden h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-bold text-[#141b34] no-underline shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] transition-transform hover:-translate-y-0.5 md:ml-2 md:inline-flex"
        >
          <MessageCircle size={17} aria-hidden="true" /> WhatsApp us
        </a>
        <button
          type="button"
          className="ml-auto grid size-11 cursor-pointer place-items-center rounded-xl border-0 bg-white/[0.06] text-white ring-1 ring-white/15 hover:bg-white/10 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="m-0 list-none overflow-hidden border-t border-white/10 px-5 pb-4 md:hidden"
          >
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base font-semibold text-white/85 no-underline"
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href={waHref}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#141b34] no-underline"
              >
                <MessageCircle size={17} aria-hidden="true" /> WhatsApp us
              </a>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ---------- Hero ---------- */

function TokenStack() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TOKENS.length), 2800)
    return () => clearInterval(t)
  }, [])
  const visible = [0, 1, 2].map((k) => TOKENS[(i + k) % TOKENS.length])
  return (
    <div className="relative h-[176px] w-full" aria-hidden="true">
      <AnimatePresence initial={false}>
        {visible.map((t, k) => (
          <motion.div
            key={t.no}
            initial={{ opacity: 0, y: 56, scale: 0.88 }}
            animate={{ opacity: k === 2 ? 0.45 : 1 - k * 0.15, y: k * 18, scale: 1 - k * 0.05, zIndex: 3 - k }}
            exit={{ opacity: 0, y: -36, scale: 1.03, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="absolute inset-x-0 top-0 rounded-[22px] bg-white/95 p-4 shadow-[0_28px_60px_-28px_rgb(5_10_40/0.85)] ring-1 ring-black/5 backdrop-blur"
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] ${t.tone}`}
              >
                <t.Icon size={22} strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-xs font-bold tracking-wide text-[#6b7290]">Token {t.no}</p>
                <p className="m-0 truncate text-base font-extrabold text-[#0e1325]">{t.label}</p>
              </div>
              {k === 0 ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.6, type: 'spring', stiffness: 400, damping: 18 }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#e7f7ee] px-2.5 py-1 text-xs font-bold text-[#0f7a45]"
                >
                  <CheckCircle2 size={13} /> Done
                </motion.span>
              ) : (
                <span className="rounded-full bg-[#eef0f7] px-2.5 py-1 text-xs font-bold text-[#5a6280]">In queue</span>
              )}
            </div>
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#eef0f7]">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#2f6bff]"
                initial={{ width: '12%' }}
                animate={{ width: k === 0 ? '100%' : '38%' }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const HEADLINE = ['Insurance,', 'banking,', 'documents', 'and', 'travel', 'at', 'one', 'counter.']

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.14])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const glow = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  return (
    <section ref={ref} id="top" className="relative isolate overflow-hidden bg-[#0b1028] pt-[72px] text-white">
      <motion.div style={{ opacity: glow }} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-48 -left-40 size-[620px] rounded-full bg-[#6d4aff]/35 blur-[130px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 right-[-160px] size-[560px] rounded-full bg-[#2f6bff]/30 blur-[130px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_30%_20%,black_25%,transparent_70%)]" />
      </motion.div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-12 pb-14 sm:gap-16 sm:px-8 sm:pb-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pt-20 lg:pb-40">
        <motion.div style={{ y: copyY }} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
          <motion.p
            variants={fadeUp}
            className="m-0 inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm font-semibold text-white/80 ring-1 ring-white/12 backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5ee0a0] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#5ee0a0]" />
            </span>
            Your neighbourhood service centre
          </motion.p>

          <h1 className="m-0 mt-6 text-[2.55rem] leading-[1.04] font-extrabold tracking-[-0.04em] text-white sm:text-6xl lg:text-[4.4rem]">
            {HEADLINE.map((w, k) => (
              <span key={k} className="inline-block overflow-hidden pb-[0.08em] align-top">
                <motion.span
                  className={`inline-block ${k >= 5 ? 'bg-gradient-to-r from-[#b3a2ff] via-[#8fb0ff] to-[#7ad3ff] bg-clip-text text-transparent' : ''}`}
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + k * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                  {k < HEADLINE.length - 1 && ' '}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p variants={fadeUp} className="m-0 mt-7 max-w-[34rem] text-lg leading-relaxed text-white/70">
            From Tatkal tickets and passports to life cover and tour packages, Manish Associates handles the paperwork, so you don’t have to
            run between offices.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={waHref}
              className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#7b5eff] to-[#4f6bff] px-6 text-base font-bold text-white no-underline shadow-[0_18px_40px_-14px_rgb(109_74_255/0.95),inset_0_1px_0_rgb(255_255_255/0.25)]"
            >
              <MessageCircle size={19} aria-hidden="true" /> Message us on WhatsApp
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href="#services"
              className="group inline-flex h-14 items-center gap-2 rounded-2xl px-6 text-base font-bold text-white no-underline ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/[0.06]"
            >
              See all services <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </motion.a>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="m-0 mt-10 grid max-w-lg list-none grid-cols-2 gap-x-6 gap-y-3 p-0 text-sm font-semibold text-white/75"
          >
            {PROMISES.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-[#8fb0ff]" aria-hidden="true" /> {p}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          {/* Photo with a soft violet frame */}
          <div className="relative aspect-[1.09/1] overflow-hidden rounded-[34px] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/15">
            <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/images/office-640.webp 640w, /images/office-1100.webp 1100w"
                  sizes="(min-width: 1024px) 560px, 92vw"
                />
                <img
                  src="/images/office-1100.jpg"
                  srcSet="/images/office-640.jpg 640w, /images/office-1100.jpg 1100w"
                  sizes="(min-width: 1024px) 560px, 92vw"
                  alt="At the desk in the Manish Associates office"
                  fetchPriority="high"
                  className="h-full w-full bg-[#1a2147] object-cover object-[50%_30%]"
                />
              </picture>
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/85 via-transparent to-transparent" />
          </div>

          {/* Floating chips */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{
              opacity: { delay: 1 },
              x: { delay: 1, type: 'spring' },
              y: { delay: 1.6, duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute -top-5 right-4 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_20px_40px_-18px_rgb(0_0_0/0.6)] sm:-right-6"
            aria-hidden="true"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#efeaff] text-[#5b37f0]">
              <ShieldCheck size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-[#6b7290]">Insurance</span>
              <span className="block text-sm font-extrabold text-[#0e1325]">Life · Health · Motor</span>
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
            transition={{
              opacity: { delay: 1.2 },
              x: { delay: 1.2, type: 'spring' },
              y: { delay: 1.8, duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute top-[38%] -left-3 hidden items-center gap-2.5 rounded-2xl bg-[#141b34]/85 px-3.5 py-2.5 text-white ring-1 ring-white/15 backdrop-blur-md sm:-left-10 sm:flex"
            aria-hidden="true"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#2f6bff]">
              <Plane size={17} />
            </span>
            <span className="text-sm font-bold">Train · Flight · Bus</span>
          </motion.div>

          <div className="relative mx-auto -mt-6 w-[92%] sm:absolute sm:-bottom-16 sm:left-1/2 sm:mt-0 sm:w-[88%] sm:-translate-x-1/2">
            <TokenStack />
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-12 rounded-t-[48px] bg-[#f6f7fb]" aria-hidden="true" />
    </section>
  )
}

/* ---------- Moving strip of services ---------- */

const STRIP = SERVICE_GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, tone: g.tone })))

function Marquee() {
  const row = [...STRIP, ...STRIP]
  return (
    <div
      className="relative overflow-hidden bg-[#f6f7fb] py-6 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      aria-hidden="true"
    >
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      >
        {row.map((it, k) => (
          <span
            key={k}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-white py-2.5 pr-5 pl-2.5 text-[15px] font-bold whitespace-nowrap text-[#1d2340] shadow-[0_1px_2px_rgb(15_21_48/0.05)] ring-1 ring-[#e3e6f0]"
          >
            <span className={`grid size-8 place-items-center rounded-full ${TONES[it.tone].tile}`}>
              <it.Icon size={15} />
            </span>
            {it.label}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ---------- Services: one panel, a tab per group ---------- */

function Services() {
  const [active, setActive] = useState(SERVICE_GROUPS[0].id)
  const g = SERVICE_GROUPS.find((x) => x.id === active)
  const t = TONES[g.tone]
  return (
    <section id="services" className="scroll-mt-20 bg-[#f6f7fb] px-5 pt-14 pb-20 sm:px-8 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#6d4aff]">What we do</p>
            <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325] sm:text-[2.6rem]">
              Four offices’ work, at one counter.
            </h2>
          </div>
          <p className="m-0 max-w-md text-base leading-relaxed text-[#5a6280]">
            We know the forms, the documents each office asks for and the deadlines that matter.
          </p>
        </Reveal>

        <Reveal className="mt-10 grid overflow-hidden rounded-[32px] bg-white shadow-[0_1px_2px_rgb(15_21_48/0.05),0_30px_60px_-40px_rgb(15_21_48/0.5)] ring-1 ring-[#e3e6f0] lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* Tabs: a column on wide screens, a sliding row on phones */}
          <div
            role="tablist"
            aria-label="Services"
            className="flex gap-1.5 overflow-x-auto border-b border-[#eceef5] p-2.5 [scrollbar-width:none] lg:flex-col lg:border-r lg:border-b-0 lg:p-3"
          >
            {SERVICE_GROUPS.map((x) => {
              const on = x.id === active
              return (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(x.id)}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent px-3 py-3 text-left transition-colors lg:w-full ${on ? '' : 'hover:bg-[#f4f5fa]'}`}
                >
                  {on && (
                    <motion.span
                      layoutId="service-tab"
                      className="absolute inset-0 rounded-2xl bg-[#141b34] shadow-[0_14px_28px_-16px_rgb(20_27_52/0.9)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-white/12 text-white' : TONES[x.tone].tile}`}
                  >
                    <x.Icon size={19} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <span className="relative min-w-0">
                    <span
                      className={`block text-[15px] leading-snug font-bold whitespace-nowrap lg:whitespace-normal ${on ? 'text-white' : 'text-[#1d2340]'}`}
                    >
                      {x.title}
                    </span>
                    <span className={`block text-xs ${on ? 'text-white/60' : 'text-[#8a90a8]'}`}>{x.items.length} services</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* The chosen group */}
          <AnimatePresence mode="wait">
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:items-center"
              role="tabpanel"
              aria-label={g.title}
            >
              <div>
                <h3 className="m-0 text-2xl font-extrabold tracking-tight text-[#0e1325]">{g.title}</h3>
                <p className="m-0 mt-2 text-[15px] leading-relaxed text-[#5a6280]">{g.blurb}</p>
                <ul className="m-0 mt-5 grid list-none gap-2 p-0 sm:grid-cols-2">
                  {g.items.map((it, k) => (
                    <motion.li
                      key={it.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + k * 0.04 }}
                      className="flex items-center gap-3 rounded-2xl bg-[#f6f7fb] px-3 py-2 text-[14px] font-semibold text-[#1d2340] ring-1 ring-[#eceef5] sm:py-2.5"
                    >
                      <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${t.tile}`}>
                        <it.Icon size={15} aria-hidden="true" />
                      </span>
                      {it.label}
                    </motion.li>
                  ))}
                </ul>
                <a
                  href={waHref}
                  className="group mt-6 inline-flex min-h-10 items-center gap-2 text-[15px] font-bold text-[#5b37f0] no-underline"
                >
                  Ask about {g.title.toLowerCase()}{' '}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </div>
              <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl md:block">
                <Photo photo={g.photo} sizes="420px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/40 to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Highlight: Tatkal ---------- */

function Highlight() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  return (
    <section ref={ref} className="bg-[#f6f7fb] px-5 pb-20 sm:px-8">
      <Reveal className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[40px] bg-[#0f1530] text-white shadow-[0_50px_100px_-50px_rgb(15_21_48/0.9)] lg:grid-cols-2">
        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <div
            className="pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-[#6d4aff]/40 blur-[100px]"
            aria-hidden="true"
          />
          <p className="relative m-0 inline-flex items-center gap-2 rounded-full bg-[#ffb648]/15 px-3 py-1 text-sm font-bold text-[#ffcf85] ring-1 ring-[#ffb648]/30">
            <Clock size={14} aria-hidden="true" /> In a hurry?
          </p>
          <h2 className="relative m-0 mt-5 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-[2.75rem]">
            Tatkal tickets and passports, handled on time.
          </h2>
          <p className="relative m-0 mt-5 max-w-md text-[17px] leading-relaxed text-white/70">
            Tatkal windows open and close fast. Share your details the day before, and we’re ready the moment booking opens.
          </p>
          <div className="relative mt-9 grid max-w-md grid-cols-3 gap-3">
            {[
              { Icon: TrainFront, label: 'Train' },
              { Icon: BookUser, label: 'Passport' },
              { Icon: Globe, label: 'Visa' },
            ].map(({ Icon, label }, k) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + k * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
                whileHover={{ y: -4, backgroundColor: 'rgb(255 255 255 / 0.1)' }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] py-5 ring-1 ring-white/10"
              >
                <Icon size={24} className="text-[#9db7ff]" aria-hidden="true" />
                <span className="text-sm font-bold">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-full">
          <motion.div style={{ y }} className="absolute -inset-y-[12%] inset-x-0">
            <Photo photo={PHOTOS.train} sizes="(min-width: 1024px) 640px, 100vw" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1530] via-[#0f1530]/30 to-transparent max-lg:bg-gradient-to-t" />
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Tours ---------- */

function Tours() {
  return (
    <section id="travel" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="m-0 text-sm font-bold text-[#2f6bff]">Tour packages</p>
            <h2 className="m-0 mt-3 text-4xl leading-[1.08] font-extrabold tracking-[-0.035em] text-[#0e1325] sm:text-5xl">
              Holidays planned, booked and sorted.
            </h2>
            <p className="m-0 mt-4 text-lg leading-relaxed text-[#5a6280]">
              Tickets, hotels and sightseeing in one package, for families, groups and couples.
            </p>
          </div>
          <motion.a
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            href={waHref}
            className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-[#141b34] px-5 font-bold text-white no-underline shadow-[0_14px_30px_-14px_rgb(20_27_52/0.8)]"
          >
            Ask for a package <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </motion.a>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-[30px] shadow-[0_30px_60px_-34px_rgb(15_21_48/0.7)] ${i % 2 ? 'lg:translate-y-10' : ''}`}
            >
              <div className="aspect-[4/3] sm:aspect-[4/5]">
                <Photo
                  photo={t.photo}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 92vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/90 via-[#0b1028]/20 to-transparent" />
              <span className="absolute top-4 left-4 grid size-10 place-items-center rounded-xl bg-white/90 text-[#141b34] backdrop-blur">
                <t.Icon size={18} aria-hidden="true" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="m-0 text-xl font-extrabold text-white">{t.title}</h3>
                <p className="m-0 mt-1 text-sm text-white/75">{t.note}</p>
                <a
                  href={waHref}
                  className="mt-3 inline-flex min-h-10 translate-y-2 items-center gap-1.5 text-sm font-bold text-white no-underline opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
                >
                  Ask about this <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- How it works ---------- */

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-20 sm:px-8 lg:pt-32 lg:pb-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="m-0 text-sm font-bold text-[#6d4aff]">How it works</p>
          <h2 className="m-0 mt-3 text-4xl leading-[1.08] font-extrabold tracking-[-0.035em] text-[#0e1325] sm:text-5xl">
            Three steps, and you’re done.
          </h2>
          <p className="m-0 mt-4 text-lg text-[#5a6280]">The same simple routine, whether it’s a bus ticket or a GST registration.</p>
        </Reveal>
        <ol className="relative m-0 mt-16 grid list-none gap-6 p-0 md:grid-cols-3">
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[62px] right-[17%] left-[17%] hidden h-[2px] origin-left bg-gradient-to-r from-[#6d4aff] via-[#4f6bff] to-[#38a8f0] md:block"
            aria-hidden="true"
          />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center rounded-[30px] bg-white px-7 pt-9 pb-10 text-center shadow-[0_24px_50px_-36px_rgb(15_21_48/0.5)] ring-1 ring-[#e3e6f0]"
            >
              <motion.span
                initial={{ scale: 0.5, rotate: -12 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 + i * 0.18, type: 'spring', stiffness: 300, damping: 16 }}
                className="relative grid size-[60px] place-items-center rounded-2xl bg-gradient-to-br from-[#6d4aff] to-[#2f6bff] text-xl font-extrabold text-white shadow-[0_16px_30px_-12px_rgb(79_90_255/0.9)] ring-8 ring-[#f6f7fb]"
              >
                {i + 1}
              </motion.span>
              <h3 className="m-0 mt-6 text-xl font-extrabold text-[#0e1325]">{s.title}</h3>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-[#5a6280]">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- Contact ---------- */

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 bg-[#f6f7fb] px-5 pb-20 sm:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[#0b1028] text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-32 -bottom-40 size-[460px] rounded-full bg-[#2f6bff]/30 blur-[110px]" />
          <div className="absolute -top-32 left-1/3 size-[380px] rounded-full bg-[#6d4aff]/25 blur-[110px]" />
        </div>
        <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:p-16">
          <div>
            <h2 className="m-0 text-4xl leading-[1.08] font-extrabold tracking-[-0.035em] text-white sm:text-5xl">
              Drop by, call or send a message.
            </h2>
            <p className="m-0 mt-4 max-w-lg text-lg leading-relaxed text-white/70">
              Tell us what you need and we’ll tell you exactly what to bring. Most jobs start the same day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={waHref}
                className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-white px-6 font-bold text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
              >
                <MessageCircle size={19} aria-hidden="true" /> WhatsApp
              </motion.a>
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={telHref}
                className="inline-flex h-14 items-center gap-2.5 rounded-2xl px-6 font-bold text-white no-underline ring-1 ring-white/25 hover:bg-white/[0.06]"
              >
                <Phone size={18} aria-hidden="true" /> Call us
              </motion.a>
            </div>
            <dl className="m-0 mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { Icon: Phone, label: 'Phone', value: CONTACT.phone, ph: 'Phone number' },
                { Icon: MapPin, label: 'Address', value: CONTACT.address, ph: 'Shop address' },
                { Icon: Clock, label: 'Open', value: CONTACT.hours, ph: 'Opening hours' },
              ].map(({ Icon, label, value, ph }) => (
                <div key={label} className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
                  <dt className="flex items-center gap-2 text-sm font-bold text-[#a9b8ff]">
                    <Icon size={16} aria-hidden="true" /> {label}
                  </dt>
                  <dd className="m-0 mt-1.5 text-[15px] font-semibold text-white/90">
                    <Detail value={value} placeholder={ph} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative aspect-[4/3.3] overflow-hidden rounded-[30px] ring-1 ring-white/15">
            <Photo photo={PHOTOS.handshake} sizes="(min-width: 1024px) 520px, 92vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/70 to-transparent" />
            <p className="absolute bottom-5 left-5 m-0 max-w-[16rem] text-lg leading-snug font-extrabold">
              Friendly help, and the job done right the first time.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Scroll progress ---------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#6d4aff] via-[#4f6bff] to-[#38a8f0]"
    />
  )
}

function Footer() {
  return (
    <footer className="bg-[#f6f7fb] px-5 pb-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-[#e1e4ee] pt-8">
        <BrandMark />
        <p className="m-0 text-sm text-[#6b7290]">
          © {new Date().getFullYear()} Manish Associates. Insurance, banking, documents and travel.
        </p>
        <Link
          to="/login"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[#5a6280] no-underline hover:text-[#141b34]"
        >
          Staff sign in
        </Link>
      </div>
    </footer>
  )
}

function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#f6f7fb] font-[Manrope,system-ui,sans-serif] text-[#0e1325] antialiased [scroll-behavior:smooth]">
        <ScrollProgress />
        <TopNav />
        <main>
          <Hero />
          <Marquee />
          <Services />
          <Highlight />
          <Tours />
          <HowItWorks />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}

export default Home
