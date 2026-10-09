import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { AnimatePresence, MotionConfig, motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BadgeIndianRupee,
  Banknote,
  BookUser,
  BriefcaseBusiness,
  Building,
  Building2,
  Bus,
  Calculator,
  Car,
  CheckCircle2,
  Clock,
  Factory,
  FileCheck2,
  FileText,
  Fingerprint,
  Globe,
  HandCoins,
  HandHeart,
  HeartPulse,
  IdCard,
  Landmark,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Phone,
  Plane,
  Receipt,
  ShieldCheck,
  Signature,
  Smartphone,
  Stamp,
  Store,
  TrainFront,
  TreePalm,
  TrendingUp,
  Umbrella,
  Users,
  Utensils,
  X,
  Zap,
} from 'lucide-react'

/*
 * The public landing page for Manish Associates: one counter for insurance, banking,
 * documents, tickets and tours. Navy, violet and blue, matching the dashboard.
 *
 * Fill in CONTACT below. Until then the page shows clearly marked placeholders,
 * the same way it does for photos.
 */
// From the shop's business listing.
const SINCE = { years: 7, town: 'Rewa' }

const CONTACT = {
  phone: '+91 91312 22579',
  whatsapp: '919131222579', // digits only with country code
  address: 'Maa GST Suvidha Kendra, Dhekha, Super Bazar, Rewa 486001, Madhya Pradesh',
  hours: 'Open until 8:30 pm', // e.g. 'Monday to Saturday, 9:30 am to 8:30 pm'
}

// Unsplash photos (free to use under the Unsplash licence). Swap an id to change a photo.
const PHOTOS = {
  insurance: { id: '1576091160550-2173dba999ef', alt: 'A stethoscope beside a laptop' },
  banking: { id: '1563013544-824ae1b704d3', alt: 'Paying online with a card' },
  documents: { id: '1554224155-6726b3ff858f', alt: 'Forms and a calculator on a desk' },
  train: { id: '1474487548417-781cb71495f3', alt: 'A train on the tracks' },
  travel: { id: '1436491865332-7a61a109cc05', alt: 'The wing of a plane above the clouds' },
  hills: { id: '1506905925346-21bda4d32df4', alt: 'Snow mountains above the clouds' },
  pilgrimage: { id: '1548013146-72479768bada', alt: 'The Taj Mahal through a carved archway' },
  beach: { id: '1507525428034-b723cf961d3e', alt: 'A quiet beach at sunset' },
  international: { id: '1512453979798-5ea266f8880c', alt: 'The Dubai skyline at dusk' },
  business: { id: '1600880292203-757bb62b4baf', alt: 'Two colleagues celebrating at a desk' },
  signing: { id: '1450101499163-c8848c66ca85', alt: 'Signing a form' },
  promise: { id: '1551836022-d5d88e9218df', alt: 'An advisor going through a plan with a customer at a desk' },
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
    title: 'Insurance and investments',
    blurb: 'Help choosing the right cover and plan, filling the forms, and following up on claims.',
    Icon: ShieldCheck,
    tone: 'violet',
    items: [
      { Icon: Umbrella, label: 'Life insurance' },
      { Icon: HeartPulse, label: 'Health insurance' },
      { Icon: Car, label: 'Motor and general insurance' },
      { Icon: TrendingUp, label: 'SIP and mutual funds' },
      { Icon: HandCoins, label: 'Loans' },
    ],
  },
  {
    id: 'banking',
    photo: PHOTOS.banking,
    title: 'Banking and payments',
    blurb: 'Everyday banking at the counter, without the queue at the branch.',
    Icon: Landmark,
    tone: 'blue',
    items: [
      { Icon: BadgeIndianRupee, label: 'Domestic money transfer' },
      { Icon: Fingerprint, label: 'Aadhaar banking (AEPS)' },
      { Icon: Banknote, label: 'Micro ATM cash withdrawal' },
      { Icon: Landmark, label: 'Kiosk banking' },
      { Icon: Zap, label: 'Utility bill payments' },
    ],
  },
  {
    id: 'tax',
    photo: PHOTOS.documents,
    title: 'GST and income tax',
    blurb: 'Registrations, returns and bills filed correctly and on time, so there are no late fees.',
    Icon: Calculator,
    tone: 'navy',
    items: [
      { Icon: Receipt, label: 'GST registration and returns' },
      { Icon: FileText, label: 'E-way bill' },
      { Icon: Stamp, label: 'Income tax returns (ITR)' },
      { Icon: IdCard, label: 'PAN card' },
      { Icon: Calculator, label: 'TDS and professional tax' },
      { Icon: BookUser, label: 'Accounting' },
    ],
  },
  {
    id: 'business',
    photo: PHOTOS.business,
    title: 'Business registrations',
    blurb: 'Everything a new or growing business needs to be registered and compliant.',
    Icon: BriefcaseBusiness,
    tone: 'violet',
    items: [
      { Icon: Building2, label: 'Company formation and ROC work' },
      { Icon: Factory, label: 'Udyog Aadhaar (MSME)' },
      { Icon: Utensils, label: 'FSSAI food licence' },
      { Icon: Award, label: 'Trademark' },
      { Icon: Signature, label: 'Digital signature (DSC)' },
      { Icon: Users, label: 'EPF and ESIC' },
      { Icon: Globe, label: 'Import export code (IEC)' },
      { Icon: Building, label: 'RERA registration' },
      { Icon: HandHeart, label: 'NGO and trust registration' },
    ],
  },
  {
    id: 'documents',
    photo: PHOTOS.signing,
    title: 'Passport, visa and documents',
    blurb: 'We check every paper before it goes in, so applications don’t come back.',
    Icon: FileCheck2,
    tone: 'blue',
    items: [
      { Icon: BookUser, label: 'Passport, normal and Tatkal' },
      { Icon: Globe, label: 'Visa, normal and urgent' },
      { Icon: Smartphone, label: 'Digital India services' },
      { Icon: Store, label: 'Shop registration' },
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
  {
    Icon: MessageCircle,
    title: 'Tell us what you need',
    body: 'Walk in, call or send a WhatsApp message. We reply with the documents to bring and the full fee.',
    tag: 'Same day',
  },
  {
    Icon: FileCheck2,
    title: 'Share your documents',
    body: 'Bring the papers or send clear photos. We check every page before anything is submitted.',
    tag: 'Checked twice',
  },
  {
    Icon: CheckCircle2,
    title: 'We handle the rest',
    body: 'We file, book or apply for you, and send updates on WhatsApp until the job is done.',
    tag: 'Updates on WhatsApp',
  },
]

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
function Detail({ value, placeholder, href }) {
  if (value && href)
    return (
      <a
        href={href}
        {...(href.startsWith('tel:') ? {} : { target: '_blank', rel: 'noreferrer' })}
        className="inline-flex min-h-8 items-center text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
      >
        {value}
      </a>
    )
  if (value) return <span>{value}</span>
  return <span className="rounded-md border border-dashed border-current/40 px-1.5 py-0.5 text-[0.95em] opacity-70">{placeholder}</span>
}

const telHref = CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s+/g, '')}` : '#contact'
const mapsHref = CONTACT.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}` : undefined
// A WhatsApp chat with the shop, with a ready-written first message.
const waLink = (text = 'Namaste, I would like to know about your services.') =>
  CONTACT.whatsapp ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}` : '#contact'
const waHref = waLink()

// The WhatsApp logo, in the current text colour.
function WhatsAppIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35M12.04 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.88-9.88 9.88M20.45 3.49A11.81 11.81 0 0 0 12.04 0C5.48 0 .13 5.34.13 11.9c0 2.1.55 4.14 1.59 5.95L.03 24l6.3-1.65a11.88 11.88 0 0 0 5.71 1.45h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.48-8.41" />
    </svg>
  )
}

function BrandMark({ light = false }) {
  return <Logo size="md" onLight={!light} />
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
        <ul className="m-0 ml-auto hidden list-none items-center gap-1 p-0 lg:flex">
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
          target="_blank"
          rel="noreferrer"
          className="ml-auto hidden h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-bold whitespace-nowrap text-[#141b34] no-underline shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] transition-transform hover:-translate-y-0.5 sm:inline-flex lg:ml-2"
        >
          <WhatsAppIcon size={18} className="text-[#25D366]" /> WhatsApp us
        </a>
        <button
          type="button"
          className="ml-auto grid size-11 cursor-pointer place-items-center rounded-xl border-0 bg-white/[0.06] text-white ring-1 ring-white/15 hover:bg-white/10 sm:ml-2 lg:hidden"
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
            className="m-0 list-none overflow-hidden border-t border-white/10 px-5 pb-4 lg:hidden"
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
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#141b34] no-underline"
              >
                <WhatsAppIcon size={18} className="text-[#25D366]" /> WhatsApp us
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

// The words that cycle at the end of the headline.
const ROTATING = ['insurance', 'Tatkal tickets', 'GST returns', 'passport', 'FSSAI licence', 'next holiday']

// Shortcuts under the headline, one per kind of work.
const QUICK = [
  { label: 'Insurance', Icon: ShieldCheck, href: '#services' },
  { label: 'Banking', Icon: Landmark, href: '#services' },
  { label: 'GST and tax', Icon: Calculator, href: '#services' },
  { label: 'Passport', Icon: BookUser, href: '#services' },
  { label: 'Tickets', Icon: TrainFront, href: '#services' },
  { label: 'Tours', Icon: TreePalm, href: '#travel' },
]

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ROTATING.length), 2600)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="block overflow-hidden pb-[0.06em]" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROTATING[i]}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block bg-gradient-to-r from-[#b8a8ff] via-[#8fb0ff] to-[#7ad3ff] bg-clip-text whitespace-nowrap text-transparent"
        >
          {ROTATING[i]}.
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.12])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -50])
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

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-8 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 lg:pt-10 lg:pb-24">
        <motion.div style={{ y: copyY }} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
          <motion.p
            variants={fadeUp}
            className="m-0 inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1 pr-3.5 pl-1 text-sm font-semibold text-white/80 ring-1 ring-white/12 backdrop-blur"
          >
            <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[#7b5eff] to-[#2f6bff]">
              <ShieldCheck size={13} aria-hidden="true" />
            </span>
            Insurance advisor and service centre in Rewa
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="m-0 mt-6 text-[2.6rem] leading-[1.06] font-extrabold tracking-[-0.04em] text-white sm:text-6xl lg:text-[4.1rem]"
          >
            One counter for your
            <RotatingWord />
          </motion.h1>

          <motion.p variants={fadeUp} className="m-0 mt-6 max-w-[33rem] text-lg leading-relaxed text-white/70">
            Insurance, banking, GST and tax, business registrations, passports, tickets and tours, handled by people who know the paperwork.
            No running between offices, no surprises on the fee.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#7b5eff] to-[#4f6bff] px-6 text-base font-bold text-white no-underline shadow-[0_18px_40px_-14px_rgb(109_74_255/0.95),inset_0_1px_0_rgb(255_255_255/0.25)]"
            >
              <WhatsAppIcon size={20} /> Message us on WhatsApp
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={telHref}
              className="inline-flex h-14 items-center gap-2.5 rounded-2xl px-6 text-base font-bold text-white no-underline ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/[0.06]"
            >
              <Phone size={18} aria-hidden="true" /> Call the office
            </motion.a>
          </motion.div>

          {/* What we handle, as shortcuts */}
          <motion.div variants={fadeUp} className="mt-10">
            <p className="m-0 text-sm font-semibold text-white/50">What can we help with?</p>
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {QUICK.map(({ label, Icon, href }, k) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + k * 0.06 }}
                >
                  <a
                    href={href}
                    className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.06] pr-3.5 pl-2 text-sm font-bold text-white/85 no-underline ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white"
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-[#a9c2ff] transition-colors group-hover:bg-[#6d4aff] group-hover:text-white">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    {label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[540px] lg:max-w-[480px]"
        >
          {/* Glow ring behind the photo */}
          <div
            className="absolute -inset-3 -z-10 rounded-[44px] bg-gradient-to-br from-[#6d4aff]/50 via-[#2f6bff]/20 to-transparent blur-2xl"
            aria-hidden="true"
          />

          <div className="relative aspect-[1.05/1] overflow-hidden rounded-[36px] lg:aspect-[1.15/1] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/15">
            <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/images/office-640.webp 640w, /images/office-1100.webp 1100w"
                  sizes="(min-width: 1024px) 540px, 92vw"
                />
                <img
                  src="/images/office-1100.jpg"
                  srcSet="/images/office-640.jpg 640w, /images/office-1100.jpg 1100w"
                  sizes="(min-width: 1024px) 540px, 92vw"
                  alt="At the desk in the Manish Associates office"
                  fetchPriority="high"
                  className="h-full w-full bg-[#1a2147] object-cover object-[50%_28%]"
                />
              </picture>
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/45 via-transparent to-transparent" />
          </div>

          {/* Years in business, over the plain wall */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: 0.9 },
              x: { delay: 0.9, type: 'spring' },
              y: { delay: 1.5, duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute top-5 left-5 flex items-center gap-3 rounded-2xl bg-white py-2.5 pr-4 pl-2.5 shadow-[0_20px_40px_-18px_rgb(0_0_0/0.6)] lg:top-10 lg:-left-10"
          >
            <img src="/brand/mark-64.png" alt="" width="40" height="40" className="size-10 rounded-xl" />
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-[#6b7290]">Serving {SINCE.town}</span>
              <span className="block text-sm font-extrabold text-[#0e1325]">{SINCE.years} years in business</span>
            </span>
          </motion.div>

          {/* The counter's queue */}
          <div className="relative mx-auto -mt-7 w-[90%] sm:-mt-10 lg:absolute lg:right-0 lg:-bottom-[4.75rem] lg:left-0 lg:mt-0 lg:w-[86%]">
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
      className="relative z-10 -mt-9 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
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
    <section id="services" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10 pt-14 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#6d4aff]">What we do</p>
            <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325] sm:text-[2.25rem]">
              Every office’s work, at one counter.
            </h2>
          </div>
          <p className="m-0 max-w-md text-base leading-relaxed text-[#5a6280]">
            We know the forms, the documents each office asks for and the deadlines that matter.
          </p>
        </Reveal>

        <Reveal className="mt-8 grid overflow-hidden rounded-[32px] bg-white shadow-[0_1px_2px_rgb(15_21_48/0.05),0_30px_60px_-40px_rgb(15_21_48/0.5)] ring-1 ring-[#e3e6f0] lg:grid-cols-[17rem_minmax(0,1fr)]">
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
                  onClick={(e) => {
                    setActive(x.id)
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                  }}
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
                  href={waLink(`Namaste, I need help with ${g.title.toLowerCase()}.`)}
                  target="_blank"
                  rel="noreferrer"
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

// IRCTC Tatkal windows open one day before the journey date (the travel date itself not counted).
const TATKAL_WINDOWS = [
  { time: '10:00', meridiem: 'AM', label: 'AC classes', note: '1A, 2A, 3A, CC, EC' },
  { time: '11:00', meridiem: 'AM', label: 'Non-AC classes', note: 'Sleeper and 2S' },
]

const TATKAL_NEEDS = [
  { Icon: IdCard, text: 'Name, age and ID of each traveller' },
  { Icon: TrainFront, text: 'Train, route, class and date' },
  { Icon: Phone, text: 'A mobile number for the ticket' },
]

function Highlight() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  return (
    <section ref={ref} className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <Reveal className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[32px] bg-[#0f1530] text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Copy */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-[#6d4aff]/40 blur-[100px]"
            aria-hidden="true"
          />
          <p className="relative m-0 text-sm font-bold text-[#a9b8ff]">Tatkal and urgent work</p>
          <h2 className="relative m-0 mt-5 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-[2.25rem]">
            Tatkal seats go in minutes. Your booking will be ready before that.
          </h2>
          <p className="relative m-0 mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-[17px]">
            Send your details a day before. We fill the booking in advance and submit it the moment the window opens. The same goes for
            Tatkal passports and urgent visas.
          </p>

          <p className="relative m-0 mt-6 text-sm font-bold text-white/85">For a Tatkal train ticket, send us:</p>
          <ul className="relative m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {TATKAL_NEEDS.map(({ Icon, text }, k) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + k * 0.08 }}
                className="flex items-center gap-3 text-[15px] font-semibold text-white/90"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2f6bff]/25 text-[#a9c2ff] ring-1 ring-[#2f6bff]/30">
                  <Icon size={17} aria-hidden="true" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>

          <motion.a
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            href={waLink('Namaste, I want to book a Tatkal ticket. Here are the details:')}
            target="_blank"
            rel="noreferrer"
            className="relative mt-6 inline-flex h-12 items-center gap-2.5 rounded-2xl bg-white px-6 font-bold text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
          >
            <WhatsAppIcon size={19} className="text-[#25D366]" /> Send details on WhatsApp
          </motion.a>
        </div>

        {/* Train photo, with the booking times on it */}
        <div className="relative min-h-[380px] overflow-hidden lg:min-h-full">
          <motion.div style={{ y }} className="absolute -inset-y-[12%] inset-x-0">
            <Photo photo={PHOTOS.train} sizes="(min-width: 1024px) 640px, 100vw" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1530] via-[#0f1530]/25 to-transparent max-lg:bg-gradient-to-b" />

          <div className="absolute top-5 right-5 flex flex-wrap justify-end gap-2">
            {['Tatkal train', 'Tatkal passport', 'Urgent visa'].map((x) => (
              <span
                key={x}
                className="rounded-full bg-[#0b1028]/60 px-3.5 py-1.5 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur"
              >
                {x}
              </span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 bottom-4 overflow-hidden rounded-[24px] bg-white/95 text-[#0e1325] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] backdrop-blur sm:inset-x-6 sm:bottom-6"
          >
            <p className="m-0 flex items-center justify-between gap-3 border-b border-[#eceef5] px-5 py-3 text-sm font-bold whitespace-nowrap">
              <span className="inline-flex items-center gap-2">
                <TrainFront size={16} className="text-[#5b37f0]" aria-hidden="true" /> Tatkal booking opens
              </span>
              <span className="text-xs text-[#6b7290]">1 day before travel</span>
            </p>
            <div className="grid grid-cols-2">
              {TATKAL_WINDOWS.map((w, k) => (
                <div key={w.label} className={`px-5 py-4 ${k ? 'border-0 border-l border-[#eceef5]' : ''}`}>
                  <p className="m-0 text-xs font-bold text-[#6b7290]">{w.label}</p>
                  <p className="m-0 mt-0.5 flex items-baseline gap-1">
                    <span className="text-[1.75rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-[2rem]">{w.time}</span>
                    <span className="text-xs font-bold text-[#5a6280]">{w.meridiem}</span>
                  </p>
                  <p className="m-0 mt-1 text-xs text-[#8a90a8]">{w.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Tours ---------- */

const INCLUDED = [
  { Icon: Plane, label: 'Train or flight tickets' },
  { Icon: Building2, label: 'Hotel stays' },
  { Icon: Car, label: 'Cabs and transfers' },
  { Icon: Mountain, label: 'Sightseeing plan' },
]

function Tours() {
  return (
    <section id="travel" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
          <div>
            <p className="m-0 text-sm font-bold text-[#6d4aff]">Tour packages</p>
            <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325] sm:text-[2.25rem]">
              Holidays planned for you, from the first ticket to the last night.
            </h2>
            <p className="m-0 mt-4 max-w-xl text-base leading-relaxed text-[#5a6280] sm:text-lg">
              Tell us where, when and how many. We put together a package that fits your budget, for families, groups and couples.
            </p>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {INCLUDED.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-sm font-bold text-[#1d2340] shadow-[0_1px_2px_rgb(15_21_48/0.05)] ring-1 ring-[#e3e6f0]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e4f4ff] text-[#0b6fb0]">
                  <Icon size={17} aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-[28px] shadow-[0_30px_60px_-34px_rgb(15_21_48/0.7)] ${i % 2 ? 'lg:mt-6' : ''}`}
            >
              <div className="aspect-[4/3] sm:aspect-[4/4.6]">
                <Photo
                  photo={t.photo}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 92vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/90 via-[#0b1028]/15 to-transparent" />
              <span className="absolute top-4 left-4 grid size-10 place-items-center rounded-xl bg-white/90 text-[#141b34] backdrop-blur">
                <t.Icon size={18} aria-hidden="true" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="m-0 text-xl font-extrabold text-white">{t.title}</h3>
                <p className="m-0 mt-1 text-sm text-white/75">{t.note}</p>
                <a
                  href={waLink(`Namaste, I want to plan a trip: ${t.title.toLowerCase()}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-sm font-bold text-white no-underline ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white hover:text-[#141b34]"
                >
                  Plan this trip <ArrowRight size={15} aria-hidden="true" />
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
    <section id="how" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0f1530] p-6 text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)] sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 left-1/4 size-[420px] rounded-full bg-[#6d4aff]/30 blur-[110px]" />
          <div className="absolute -right-24 -bottom-40 size-[420px] rounded-full bg-[#2f6bff]/25 blur-[110px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#a9b8ff]">How it works</p>
            <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-white sm:text-[2.25rem]">
              Three steps, and the job is done.
            </h2>
          </div>
          <p className="m-0 max-w-sm text-base leading-relaxed text-white/65">
            The same simple routine, whether it’s a bus ticket or a GST registration.
          </p>
        </div>

        <ol className="relative m-0 mt-8 grid list-none gap-3 p-0 md:grid-cols-3 md:gap-4">
          {STEPS.map(({ Icon, title, body, tag }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-4 rounded-[24px] bg-white/[0.05] p-5 ring-1 ring-white/10"
            >
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#7b5eff] to-[#2f6bff] shadow-[0_14px_28px_-12px_rgb(79_90_255/0.9)]">
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white text-[11px] font-extrabold text-[#141b34]">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="m-0 text-[17px] font-extrabold text-white">{title}</h3>
                <p className="m-0 mt-1 text-sm leading-relaxed text-white/65">{body}</p>
                <span className="mt-2.5 inline-flex rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-bold text-[#c9d4ff] ring-1 ring-white/10">
                  {tag}
                </span>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="relative mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6">
          <p className="m-0 flex-1 text-base font-bold text-white">Ready to start? Send us a message and we’ll tell you what to bring.</p>
          <motion.a
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-13 items-center gap-2.5 rounded-2xl bg-white px-6 font-bold text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
          >
            <WhatsAppIcon size={19} className="text-[#25D366]" /> Start on WhatsApp
          </motion.a>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Our promise ---------- */

const REASONS = [
  {
    Icon: BadgeIndianRupee,
    title: 'Fees told upfront',
    body: 'You know the full charge before any work starts. No hidden extras at the end.',
  },
  {
    Icon: FileCheck2,
    title: 'Documents checked twice',
    body: 'Every form is checked before it’s submitted, so applications don’t bounce back.',
  },
  { Icon: MessageCircle, title: 'Updates on WhatsApp', body: 'You hear from us at each step, without having to call and ask.' },
  { Icon: ShieldCheck, title: 'Help after the sale', body: 'Renewal reminders for your policies, and help with the forms when you claim.' },
]

function WhyUs() {
  return (
    <section className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#6d4aff]">Our promise</p>
            <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325] sm:text-[2.25rem]">
              Small promises, kept every time.
            </h2>
          </div>
          <p className="m-0 max-w-md text-base leading-relaxed text-[#5a6280]">
            Whether it’s a bus ticket or a life policy, this is how every job at our counter is handled.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Photo with the shop's track record */}
          <Reveal className="relative min-h-[260px] overflow-hidden rounded-[28px] sm:min-h-[320px] shadow-[0_30px_60px_-34px_rgb(15_21_48/0.7)] lg:min-h-0">
            <Photo photo={PHOTOS.promise} sizes="(min-width: 1024px) 600px, 92vw" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/90 via-[#0b1028]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
              <p className="m-0 text-sm font-bold text-[#c9bfff]">Serving {SINCE.town}</p>
              <p className="m-0 mt-1 text-[2.5rem] leading-none font-extrabold tracking-tight">{SINCE.years} years</p>
              <p className="m-0 mt-2 max-w-xs text-[15px] leading-relaxed text-white/75">
                of tickets, policies, returns and registrations, from one counter at Super Bazar.
              </p>
            </div>
          </Reveal>

          {/* The promises */}
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {REASONS.map(({ Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                className="group relative grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 overflow-hidden rounded-[24px] bg-white p-5 shadow sm:p-6-[0_24px_50px_-36px_rgb(15_21_48/0.5)] ring-1 ring-[#e3e6f0] transition-shadow hover:shadow-[0_34px_60px_-34px_rgb(40_40_120/0.5)]"
              >
                <span
                  className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-[#6d4aff]/12 to-[#2f6bff]/5 transition-transform duration-500 group-hover:scale-125"
                  aria-hidden="true"
                />
                <span className="relative row-span-2 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#6d4aff] to-[#2f6bff] text-white sm:row-span-1 sm:size-12 shadow-[0_12px_24px_-12px_rgb(79_90_255/0.9)]">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="relative m-0 self-center text-lg font-extrabold text-[#0e1325] sm:col-span-2 sm:mt-5">{title}</h3>
                <p className="relative m-0 mt-1 text-[15px] leading-relaxed text-[#5a6280] sm:col-span-2 sm:mt-1.5">{body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- Questions ---------- */

const FAQS = [
  {
    q: 'Which documents should I bring?',
    a: 'It depends on the work. Send us a WhatsApp message saying what you need, and we’ll reply with the exact list, so you only make one trip.',
  },
  {
    q: 'Can I start without visiting the office?',
    a: 'Yes, for most work. Send clear photos of your documents on WhatsApp. We’ll tell you if anything has to be signed in person.',
  },
  {
    q: 'Do you help with insurance claims and renewals?',
    a: 'Yes. We help you fill in the claim forms, follow up with the insurer, and remind you before your policy is due for renewal.',
  },
  {
    q: 'How can I pay?',
    a: 'Cash, UPI or bank transfer. You’ll know the full fee before we start, and you get a receipt for every payment.',
  },
  {
    q: 'Do you book Tatkal tickets?',
    a: 'Yes. Send the traveller details the day before, and we book the moment the Tatkal window opens. Seats depend on availability.',
  },
]

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Reveal>
          <p className="m-0 text-sm font-bold text-[#6d4aff]">Questions</p>
          <h2 className="m-0 mt-2 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325] sm:text-[2.25rem]">
            Before you come in.
          </h2>
          <p className="m-0 mt-4 max-w-sm text-base leading-relaxed text-[#5a6280] sm:text-lg">
            Can’t find your question? Send it to us on WhatsApp and we’ll reply during office hours.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="group mt-6 inline-flex min-h-10 items-center gap-2 text-[15px] font-bold text-[#5b37f0] no-underline"
          >
            Ask a question <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </Reveal>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {FAQS.map((item, i) => {
            const on = open === i
            return (
              <li
                key={item.q}
                className={`overflow-hidden rounded-3xl ring-1 transition-colors ${on ? 'bg-[#f6f7fb] ring-[#d9dcf0]' : 'bg-white ring-[#e3e6f0]'}`}
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setOpen(on ? -1 : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-5 py-4.5 text-left text-base font-bold text-[#0e1325] sm:px-6"
                  >
                    {item.q}
                    <motion.span
                      animate={{ rotate: on ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-lg leading-none font-bold ${on ? 'bg-[#6d4aff] text-white' : 'bg-[#eef0f7] text-[#141b34]'}`}
                      aria-hidden="true"
                    >
                      +
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="m-0 px-5 pb-5 text-[15px] leading-relaxed text-[#5a6280] sm:px-6">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ---------- Contact ---------- */

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10 pb-16 lg:pb-20">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0f1530] text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <motion.div
            animate={{ x: [0, -30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-32 -bottom-40 size-[460px] rounded-full bg-[#2f6bff]/30 blur-[110px]"
          />
          <div className="absolute -top-32 left-1/3 size-[380px] rounded-full bg-[#6d4aff]/25 blur-[110px]" />
        </div>
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:p-12">
          <div>
            <p className="m-0 mb-2 text-sm font-bold text-[#a9b8ff]">Contact</p>
            <h2 className="m-0 text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-white sm:text-[2.25rem]">
              Tell us what you need. We’ll take it from there.
            </h2>
            <p className="m-0 mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              Walk in, call or send a message. We’ll tell you exactly what to bring, and most work starts the same day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-white px-6 font-bold text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
              >
                <WhatsAppIcon size={20} className="text-[#25D366]" /> WhatsApp us
              </motion.a>
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={telHref}
                className="inline-flex h-14 items-center gap-2.5 rounded-2xl px-6 font-bold text-white no-underline ring-1 ring-white/25 hover:bg-white/[0.06]"
              >
                <Phone size={18} aria-hidden="true" /> Call the office
              </motion.a>
            </div>
          </div>
          <dl className="m-0 grid gap-3">
            {[
              { Icon: Phone, label: 'Phone and WhatsApp', value: CONTACT.phone, ph: 'Phone number', href: telHref },
              { Icon: MapPin, label: 'Visit the office', value: CONTACT.address, ph: 'Shop address', href: mapsHref },
              { Icon: Clock, label: 'Opening hours', value: CONTACT.hours, ph: 'Opening hours' },
            ].map(({ Icon, label, value, ph, href }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6d4aff] to-[#2f6bff]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-bold text-[#a9b8ff]">{label}</dt>
                  <dd className="m-0 mt-0.5 text-[15px] font-semibold text-white/90">
                    <Detail value={value} placeholder={ph} href={href} />
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#0b1028] px-5 pt-12 pb-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 lg:col-span-1">
            <BrandMark light />
            <p className="m-0 mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Insurance, banking, GST and tax, registrations, passports, tickets and tours, at one counter.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-bold text-white no-underline ring-1 ring-white/12 hover:bg-white/[0.12]"
            >
              <WhatsAppIcon size={17} className="text-[#25D366]" /> WhatsApp us
            </a>
          </div>
          {[
            { title: 'Services', links: SERVICE_GROUPS.map((g) => ({ label: g.title, href: '#services' })) },
            {
              title: 'Popular',
              links: [
                { label: 'Tatkal train tickets', href: '#services' },
                { label: 'Passport, Tatkal', href: '#services' },
                { label: 'Health insurance', href: '#services' },
                { label: 'Tour packages', href: '#travel' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'How it works', href: '#how' },
                { label: 'Contact', href: '#contact' },
                { label: 'Staff sign in', to: '/login' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="m-0 text-sm font-bold text-white">{col.title}</p>
              <ul className="m-0 mt-3 flex list-none flex-col p-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="inline-flex min-h-9 items-center text-sm text-white/60 no-underline hover:text-white">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="inline-flex min-h-9 items-center text-sm text-white/60 no-underline hover:text-white">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="m-0 mt-12 border-t border-white/10 pt-6 text-xs text-white/45">© {YEAR} Manish Associates. All rights reserved.</p>
      </div>
    </footer>
  )
}

const YEAR = new Date().getFullYear()

// In-page links scroll smoothly to their section and leave the address as it is (no #top, #services...).
function scrollToHash(e) {
  const link = e.target.closest('a[href^="#"]')
  if (!link) return
  const id = link.getAttribute('href').slice(1)
  e.preventDefault()
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  if (!id || id === 'top') return window.scrollTo({ top: 0, behavior })
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}

function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        onClick={scrollToHash}
        className="min-h-screen bg-[#f6f7fb] font-[Manrope,system-ui,sans-serif] text-[#0e1325] antialiased [scroll-behavior:smooth]"
      >
        <TopNav />
        <main>
          <Hero />
          <Marquee />
          <Services />
          <Highlight />
          <Tours />
          <HowItWorks />
          <WhyUs />
          <Faq />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}

export default Home
