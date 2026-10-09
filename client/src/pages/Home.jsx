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
// The office on the map.
const MAP = { lat: 24.54142, lng: 81.279617 }
const mapsHref = `https://maps.google.com/?q=${MAP.lat},${MAP.lng}`
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
                <p className="m-0 truncate text-[15px] font-extrabold text-[#0e1325] sm:text-base">{t.label}</p>
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

// The last words of the headline roll like a counter display: the next word slides in as the old one slides out,
// inside a fixed-height window, so the line never goes blank or changes height.
function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ROTATING.length), 2600)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="relative block h-[1.16em] overflow-hidden" aria-live="polite">
      <AnimatePresence initial={false}>
        <motion.span
          key={ROTATING[i]}
          initial={{ y: '105%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-105%' }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-x-0 top-0 block bg-gradient-to-r from-[#b8a8ff] via-[#8fb0ff] to-[#7ad3ff] bg-clip-text whitespace-nowrap text-transparent will-change-transform"
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
  // Only the photo drifts with the scroll, and only on the GPU (no opacity or blur changes), so nothing flickers.
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])

  return (
    <section ref={ref} id="top" className="relative isolate overflow-hidden bg-[#0b1028] pt-[72px] text-white">
      {/* Soft light behind the headline: painted once as gradients, not as moving blurred shapes */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(620px_circle_at_8%_0%,rgb(109_74_255/0.32),transparent_70%),radial-gradient(560px_circle_at_100%_35%,rgb(47_107_255/0.26),transparent_70%)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_30%_20%,black_25%,transparent_70%)]" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col px-5 pt-6 pb-14 sm:px-8 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-8 md:pt-8 md:pb-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 lg:pt-10 lg:pb-24">
        <motion.div
          className="max-md:contents"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="m-0 inline-flex items-center gap-2 self-start rounded-full bg-white/[0.07] py-1 pr-3.5 pl-1 text-sm font-semibold text-white/80 ring-1 ring-white/12 backdrop-blur max-md:order-1"
          >
            <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[#7b5eff] to-[#2f6bff]">
              <ShieldCheck size={13} aria-hidden="true" />
            </span>
            <span>
              Insurance advisor<span className="max-sm:hidden"> and service centre</span> in Rewa
            </span>
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="m-0 mt-5 text-[clamp(2.1rem,5.6vw,4.1rem)] leading-[1.06] lg:text-[4.1rem] font-extrabold tracking-[-0.04em] text-white max-md:order-2 md:mt-6"
          >
            One counter for your
            <RotatingWord />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="m-0 mt-5 max-w-[33rem] text-[clamp(0.95rem,1.7vw,1.125rem)] leading-relaxed text-white/70 lg:text-[1.125rem] max-md:order-4 md:mt-6"
          >
            Insurance, banking, GST and tax, business registrations, passports, tickets and tours, handled by people who know the paperwork.
            No running between offices, no surprises on the fee.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6 grid grid-cols-2 gap-2.5 max-md:order-5 sm:flex sm:flex-wrap sm:gap-3 md:mt-8">
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7b5eff] to-[#4f6bff] px-4 text-[15px] font-bold whitespace-nowrap text-white no-underline sm:h-14 sm:gap-2.5 sm:px-6 sm:text-base shadow-[0_18px_40px_-14px_rgb(109_74_255/0.95),inset_0_1px_0_rgb(255_255_255/0.25)]"
            >
              <WhatsAppIcon size={20} /> <span className="sm:hidden">WhatsApp</span>
              <span className="max-sm:hidden">Message us on WhatsApp</span>
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={telHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-bold whitespace-nowrap text-white no-underline ring-1 ring-white/20 sm:h-14 sm:gap-2.5 sm:px-6 sm:text-base backdrop-blur transition-colors hover:bg-white/[0.06]"
            >
              <Phone size={18} aria-hidden="true" /> <span className="sm:hidden">Call us</span>
              <span className="max-sm:hidden">Call the office</span>
            </motion.a>
          </motion.div>

          {/* What we handle, as shortcuts */}
          <motion.div variants={fadeUp} className="mt-6 max-md:order-6 md:mt-10">
            <p className="m-0 text-sm font-semibold text-white/50">What can we help with?</p>
            <ul className="m-0 mt-3 flex list-none gap-2 p-0 max-sm:-mx-5 max-sm:overflow-x-auto max-sm:px-5 max-sm:[scrollbar-width:none] sm:flex-wrap">
              {QUICK.map(({ label, Icon, href }, k) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + k * 0.06 }}
                >
                  <a
                    href={href}
                    className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-xl whitespace-nowrap bg-white/[0.06] pr-3.5 pl-2 text-sm font-bold text-white/85 no-underline ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white"
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
          className="relative mt-6 w-full max-md:order-3 md:mx-auto md:mt-0 lg:max-w-[480px]"
        >
          {/* Glow ring behind the photo */}
          <div
            className="absolute -inset-3 -z-10 rounded-[44px] bg-gradient-to-br from-[#6d4aff]/50 via-[#2f6bff]/20 to-transparent blur-2xl"
            aria-hidden="true"
          />

          <div className="relative aspect-[16/10] overflow-hidden rounded-[26px] sm:aspect-[16/9] md:aspect-[1.05/1] md:rounded-[36px] lg:aspect-[1.15/1] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/15">
            <motion.div style={{ y: imgY, scale: 1.06 }} className="absolute inset-0 will-change-transform">
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
                  className="h-full w-full bg-[#1a2147] object-cover object-[50%_22%] md:object-[50%_28%]"
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
            className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-2xl bg-white py-2 pr-3.5 pl-2 md:top-5 md:bottom-auto md:left-5 md:gap-3 md:py-2.5 md:pr-4 md:pl-2.5 shadow-[0_20px_40px_-18px_rgb(0_0_0/0.6)] lg:top-10 lg:-left-10"
          >
            <img src="/brand/mark-64.png" alt="" width="40" height="40" className="size-8 rounded-lg md:size-10 md:rounded-xl" />
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-[#6b7290]">Serving {SINCE.town}</span>
              <span className="block text-sm font-extrabold text-[#0e1325]">{SINCE.years} years in business</span>
            </span>
          </motion.div>

          {/* The counter's queue */}
          <div className="relative mx-auto -mt-7 w-[90%] max-md:hidden sm:-mt-10 lg:absolute lg:right-0 lg:-bottom-[4.75rem] lg:left-0 lg:mt-0 lg:w-[86%]">
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

// Two identical rows side by side; the track moves exactly one row's width, so the loop has no jump.
function Marquee() {
  const row = (copy) => (
    <ul className="m-0 flex shrink-0 list-none gap-2 p-0 pr-2 sm:gap-3 sm:pr-3" aria-hidden={copy || undefined}>
      {STRIP.map((it) => (
        <li
          key={it.label}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-1.5 text-[13px] font-bold sm:gap-2.5 sm:py-2.5 sm:pr-5 sm:pl-2.5 sm:text-[15px] whitespace-nowrap text-[#1d2340] shadow-[0_1px_2px_rgb(15_21_48/0.05)] ring-1 ring-[#e3e6f0]"
        >
          <span className={`grid size-6 place-items-center rounded-full sm:size-8 ${TONES[it.tone].tile}`}>
            <it.Icon size={14} aria-hidden="true" />
          </span>
          {it.label}
        </li>
      ))}
    </ul>
  )
  return (
    <div
      className="marquee relative z-10 -mt-9 overflow-hidden py-3 sm:py-4 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
      aria-label="Our services"
    >
      <div className="marquee__track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

/* ---------- Services: one panel, a tab per group ---------- */

function Services() {
  const [active, setActive] = useState(SERVICE_GROUPS[0].id)
  const g = SERVICE_GROUPS.find((x) => x.id === active)
  const t = TONES[g.tone]
  return (
    <section id="services" className="scroll-mt-20 bg-[#f6f7fb] px-5 pt-4 pb-8 sm:px-8 sm:pt-10 lg:pt-16 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#6d4aff]">What we do</p>
            <h2 className="m-0 mt-2 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325]">
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
              className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center"
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
              <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl lg:block">
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
  { Icon: IdCard, text: 'Name, age and ID of each traveller', short: 'Name, age and ID' },
  { Icon: TrainFront, text: 'Train, route, class and date', short: 'Train, class and date' },
  { Icon: Phone, text: 'A mobile number for the ticket', short: 'Mobile number' },
]

function Highlight() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  return (
    <section ref={ref} className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <Reveal className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[32px] bg-[#0f1530] text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Copy */}
        <div className="relative z-10 px-5 pt-6 pb-4 sm:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(109_74_255/0.4),transparent)]"
            aria-hidden="true"
          />
          <p className="relative m-0 text-sm font-bold text-[#a9b8ff]">Tatkal and urgent work</p>
          <h2 className="relative m-0 mt-3 sm:mt-5 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-tight font-extrabold tracking-tight text-white">
            Tatkal seats go in minutes. Your booking will be ready before that.
          </h2>
          <p className="relative m-0 mt-3 max-w-lg text-[15px] leading-relaxed text-white/70 sm:mt-4 sm:text-[17px]">
            Send your details a day before. We fill the booking in advance and submit it the moment the window opens.
            <span className="max-sm:hidden"> The same goes for Tatkal passports and urgent visas.</span>
          </p>

          <p className="relative m-0 mt-6 text-sm font-bold text-white/85 max-lg:hidden">For a Tatkal train ticket, send us:</p>
          <ul className="relative m-0 mt-3 flex list-none flex-col gap-2 p-0 max-lg:hidden">
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
            className="relative mt-6 inline-flex h-12 items-center gap-2.5 rounded-2xl bg-white px-6 font-bold whitespace-nowrap text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)] max-lg:hidden"
          >
            <WhatsAppIcon size={19} className="text-[#25D366]" /> Send details on WhatsApp
          </motion.a>
        </div>

        {/* Train photo, with the booking times on it */}
        <div className="relative lg:min-h-[380px]">
          <div className="relative overflow-hidden max-lg:aspect-[16/9] lg:absolute lg:inset-0">
            <motion.div style={{ y }} className="absolute -inset-y-[12%] inset-x-0">
              <Photo photo={PHOTOS.train} sizes="(min-width: 1024px) 640px, 100vw" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f1530] via-[#0f1530]/25 to-transparent max-lg:bg-[linear-gradient(to_bottom,#0f1530,transparent_28%,transparent_62%,#0f1530)]" />

            <div className="absolute top-3 right-4 left-4 flex flex-wrap gap-1.5 lg:top-5 lg:right-5 lg:left-auto lg:justify-end lg:gap-2">
              {['Tatkal train', 'Tatkal passport', 'Urgent visa'].map((x) => (
                <span
                  key={x}
                  className="rounded-full bg-[#0b1028]/65 px-2.5 py-1 text-xs max-[380px]:px-2 max-[380px]:text-[11px] font-bold whitespace-nowrap text-white ring-1 ring-white/20 backdrop-blur lg:px-3.5 lg:py-1.5 lg:text-sm"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-4 -mt-14 overflow-hidden rounded-[22px] bg-white/95 text-[#0e1325] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] backdrop-blur sm:mx-6 lg:absolute lg:inset-x-6 lg:bottom-6 lg:mx-0 lg:mt-0 lg:rounded-[24px]"
          >
            <p className="m-0 flex items-center justify-between gap-3 border-b border-[#eceef5] px-4 py-2.5 text-sm font-bold whitespace-nowrap sm:px-5 sm:py-3">
              <span className="inline-flex items-center gap-2">
                <TrainFront size={16} className="text-[#5b37f0]" aria-hidden="true" /> Tatkal booking opens
              </span>
              <span className="text-xs text-[#6b7290] max-sm:hidden">1 day before travel</span>
            </p>
            <div className="grid grid-cols-2">
              {TATKAL_WINDOWS.map((w, k) => (
                <div key={w.label} className={`px-4 py-3 sm:px-5 sm:py-4 ${k ? 'border-0 border-l border-[#eceef5]' : ''}`}>
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
        {/* What to send, under the photo (phones and tablets) */}
        <div className="relative z-10 flex flex-col gap-3 px-4 pt-3 pb-4 sm:gap-4 sm:px-8 lg:hidden sm:pb-8 lg:col-span-2 lg:flex-row lg:items-end lg:gap-10 lg:border-0 lg:border-t lg:border-solid lg:border-white/10 lg:px-12 lg:py-8">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-bold text-white/85 max-sm:px-1">For a Tatkal train ticket, send us:</p>
            <ul className="m-0 mt-2.5 grid list-none grid-cols-3 gap-2 p-0 sm:mt-3 sm:grid-cols-1 sm:gap-2.5 lg:grid-cols-3 lg:gap-4">
              {TATKAL_NEEDS.map(({ Icon, text, short }, k) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + k * 0.08 }}
                  className="flex items-center gap-3 text-sm leading-snug font-semibold text-white/90 max-sm:flex-col max-sm:gap-2 max-sm:rounded-2xl max-sm:bg-white/[0.05] max-sm:px-2 max-sm:py-3 max-sm:text-center max-sm:text-xs max-sm:ring-1 max-sm:ring-white/10 sm:text-[15px]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#2f6bff]/25 sm:size-9 sm:rounded-xl text-[#a9c2ff] ring-1 ring-[#2f6bff]/30">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="sm:hidden">{short}</span>
                  <span className="max-sm:hidden">{text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <motion.a
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            href={waLink('Namaste, I want to book a Tatkal ticket. Here are the details:')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white px-5 font-bold whitespace-nowrap text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)] sm:px-6"
          >
            <WhatsAppIcon size={19} className="text-[#25D366]" /> Send details on WhatsApp
          </motion.a>
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
        <Reveal className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
          <div>
            <p className="m-0 text-sm font-bold text-[#6d4aff]">Tour packages</p>
            <h2 className="m-0 mt-2 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325]">
              Holidays planned for you, from the first ticket to the last night.
            </h2>
            <p className="m-0 mt-3 max-w-xl text-[15px] leading-relaxed text-[#5a6280] sm:mt-4 sm:text-lg">
              Tell us where, when and how many. We put together a package that fits your budget, for families, groups and couples.
            </p>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:gap-2.5">
            {INCLUDED.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-2xl bg-white px-2.5 py-2.5 text-[13px] leading-tight font-bold text-[#1d2340] sm:gap-3 sm:px-3.5 sm:py-3 sm:text-sm sm:leading-[calc(1.25/0.875)] shadow-[0_1px_2px_rgb(15_21_48/0.05)] ring-1 ring-[#e3e6f0]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e4f4ff] text-[#0b6fb0] sm:size-9 sm:rounded-xl">
                  <Icon size={17} aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {TOURS.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-[20px] shadow-[0_20px_36px_-28px_rgb(15_21_48/0.7)] sm:rounded-[28px] sm:shadow-[0_30px_60px_-34px_rgb(15_21_48/0.7)] ${i % 2 ? 'lg:mt-6' : ''}`}
            >
              <div className="aspect-[4/5] sm:aspect-[4/3.4] lg:aspect-[4/4.6]">
                <Photo
                  photo={t.photo}
                  sizes="(min-width: 1280px) 300px, 48vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/90 via-[#0b1028]/15 to-transparent" />
              <span className="absolute top-2.5 left-2.5 grid size-8 place-items-center rounded-lg bg-white/90 text-[#141b34] backdrop-blur sm:top-4 sm:left-4 sm:size-10 sm:rounded-xl">
                <t.Icon size={16} aria-hidden="true" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
                <h3 className="m-0 text-[15px] leading-tight font-extrabold text-white sm:text-xl sm:leading-[1.4]">{t.title}</h3>
                <p className="m-0 mt-1 text-xs leading-snug text-white/75 max-sm:line-clamp-2 sm:text-sm sm:leading-[calc(1.25/0.875)]">
                  {t.note}
                </p>
                <a
                  href={waLink(`Namaste, I want to plan a trip: ${t.title.toLowerCase()}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-lg bg-white/15 px-2.5 text-xs font-bold sm:mt-3 sm:min-h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm text-white no-underline ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white hover:text-[#141b34]"
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
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0f1530] px-5 py-6 text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)] sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 left-1/4 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(109_74_255/0.3),transparent)]" />
          <div className="absolute -right-24 -bottom-40 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(47_107_255/0.25),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-x-10 gap-y-2 sm:gap-y-4">
          <div className="max-w-xl">
            <p className="m-0 text-sm font-bold text-[#a9b8ff]">How it works</p>
            <h2 className="m-0 mt-2 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
              Three steps, and the job is done.
            </h2>
          </div>
          <p className="m-0 max-w-sm text-[15px] leading-relaxed text-white/65 sm:text-base">
            The same simple routine, whether it’s a bus ticket or a GST registration.
          </p>
        </div>

        <ol className="relative m-0 mt-6 grid list-none gap-5 p-0 sm:mt-8 sm:grid-cols-3 sm:gap-3 lg:gap-4">
          {STEPS.map(({ Icon, title, body, tag }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-4 sm:rounded-[24px] sm:bg-white/[0.05] sm:p-5 sm:ring-1 sm:ring-white/10 sm:max-lg:flex-col sm:max-lg:gap-3"
            >
              {i < STEPS.length - 1 && (
                <span
                  className="absolute top-12 -bottom-5 left-[21px] w-px bg-gradient-to-b from-[#7b5eff]/60 to-white/10 sm:hidden"
                  aria-hidden="true"
                />
              )}
              <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl sm:size-12 bg-gradient-to-br from-[#7b5eff] to-[#2f6bff] shadow-[0_14px_28px_-12px_rgb(79_90_255/0.9)]">
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white text-[11px] font-extrabold text-[#141b34]">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="m-0 text-base font-extrabold text-white sm:text-[17px] sm:leading-[1.2]">{title}</h3>
                <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-white/65 sm:text-sm">{body}</p>
                <span className="mt-2 inline-flex rounded-full sm:mt-2.5 bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-bold text-[#c9d4ff] ring-1 ring-white/10">
                  {tag}
                </span>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="relative mt-6 flex flex-col gap-3 border-0 border-t border-solid border-white/10 pt-5 sm:mt-7 sm:flex-row sm:items-center sm:gap-6 sm:pt-6">
          <p className="m-0 min-w-0 flex-1 text-[15px] font-bold text-white sm:text-base">
            Ready to start? Send us a message and we’ll tell you what to bring.
          </p>
          <motion.a
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 font-bold whitespace-nowrap sm:h-13 text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
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

// Figures for the promise section, worked out from the content above.
const SERVICE_COUNT = SERVICE_GROUPS.reduce((n, g) => n + g.items.length, 0)

function WhyUs() {
  const stats = [
    { value: `${SINCE.years} years`, label: `serving ${SINCE.town}` },
    { value: `${SERVICE_COUNT}+`, label: 'services at one counter' },
    { value: SERVICE_GROUPS.length, label: 'kinds of work, from tax to travel' },
  ]
  return (
    <section id="promise" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <Reveal className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-white shadow-[0_1px_2px_rgb(15_21_48/0.05),0_30px_60px_-40px_rgb(15_21_48/0.5)] ring-1 ring-[#e3e6f0]">
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Promises */}
          <div className="px-5 pt-6 pb-4 sm:p-8 lg:p-12">
            <p className="m-0 text-sm font-bold text-[#6d4aff]">Our promise</p>
            <h2 className="m-0 mt-2 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0e1325]">
              Small promises, kept every time.
            </h2>
            <p className="m-0 mt-2 max-w-md text-[15px] leading-relaxed text-[#5a6280] sm:mt-3 sm:text-base">
              Whether it’s a bus ticket or a life policy, this is how every job at our counter is handled.
            </p>
            <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-2 p-0 sm:mt-6 sm:gap-2.5 lg:mt-8 lg:gap-x-8 lg:gap-y-6">
              {REASONS.map(({ Icon, title, body }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-2 rounded-2xl max-[400px]:grid-cols-1 md:max-lg:grid-cols-1 bg-[#f7f7fc] p-3 ring-1 ring-[#eceef5] sm:gap-x-3 sm:p-3.5 lg:flex lg:items-start lg:gap-4 lg:rounded-none lg:bg-transparent lg:p-0 lg:ring-0"
                >
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#5b37f0] ring-1 ring-[#eceef5] sm:size-10 lg:size-11 lg:rounded-2xl lg:bg-[#f1f0fb] lg:ring-0">
                    <Icon size={18} aria-hidden="true" />
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 400, damping: 16 }}
                      className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-[#16a34a] text-white ring-2 ring-white lg:-right-1.5 lg:-bottom-1.5 lg:size-5"
                    >
                      <CheckCircle2 size={10} strokeWidth={3} aria-hidden="true" />
                    </motion.span>
                  </span>
                  <div className="contents lg:block lg:min-w-0">
                    <h3 className="m-0 text-[13px] leading-snug font-extrabold text-[#0e1325] sm:text-sm lg:text-[17px] lg:leading-[1.2]">
                      {title}
                    </h3>
                    <p className="col-span-full m-0 text-xs leading-relaxed text-[#5a6280] sm:text-[13px] lg:mt-1 lg:text-[15px]">{body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Photo */}
          <div className="relative p-3 pt-0 md:p-3 md:pl-0">
            <div className="relative aspect-[2/1] overflow-hidden rounded-[22px] sm:rounded-[26px] md:aspect-auto md:h-full">
              <Photo photo={PHOTOS.promise} sizes="(min-width: 1024px) 560px, 92vw" className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1028]/70 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-4 m-0 max-w-[15rem] text-base leading-snug font-extrabold text-white sm:bottom-5 sm:left-5 sm:text-lg">
                Advice that fits your family and your budget.
              </p>
            </div>
          </div>
        </div>

        {/* Figures */}
        <dl className="m-0 grid grid-cols-3 border-t border-[#eceef5] bg-[#0f1530] text-white">
          {stats.map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className={`flex flex-col gap-0.5 px-3 py-3.5 sm:items-start sm:gap-1 sm:px-8 sm:py-5 lg:px-10 lg:py-6 ${i ? 'border-0 border-l border-solid border-white/10' : ''}`}
            >
              <dt className="order-2 text-[11px] leading-snug text-white/65 sm:text-sm sm:leading-[calc(1.25/0.875)]">{st.label}</dt>
              <dd className="order-first m-0 text-xl font-extrabold tracking-tight whitespace-nowrap sm:text-[2rem] sm:leading-[calc(2/1.5)]">
                {st.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}

/* ---------- Questions ---------- */

// Questions people ask at the counter, grouped by topic.
const FAQS = [
  {
    topic: 'Getting started',
    items: [
      {
        q: 'Which documents should I bring?',
        a: 'It depends on the work. Send us a WhatsApp message saying what you need, and we’ll reply with the exact list, so the job is done in one visit.',
      },
      {
        q: 'Can I start without visiting the office?',
        a: 'Yes, for most work. Send clear photos of your documents on WhatsApp and we’ll begin. We’ll tell you if anything has to be signed or verified in person.',
      },
      {
        q: 'How much do you charge?',
        a: 'Each job has its own fee, plus any government or provider charges. We tell you the full amount before we start, and you get a receipt for every payment.',
      },
      { q: 'How can I pay?', a: 'Cash, UPI or bank transfer, whichever suits you.' },
    ],
  },
  {
    topic: 'Tickets and travel',
    items: [
      {
        q: 'How do Tatkal train tickets work?',
        a: 'Tatkal booking opens one day before the journey: 10:00 am for AC classes and 11:00 am for Sleeper and 2S. Send the traveller details the day before and we book the moment it opens. Seats depend on availability.',
      },
      {
        q: 'Can you plan a full tour package?',
        a: 'Yes. Tell us where, when and how many people. We put together tickets, hotels, cabs and sightseeing to fit your budget.',
      },
      {
        q: 'Do you book flights and buses too?',
        a: 'Yes, domestic and international flights, and bus tickets on most routes.',
      },
    ],
  },
  {
    topic: 'Passport and documents',
    items: [
      {
        q: 'What is the difference between a normal and a Tatkal passport?',
        a: 'Tatkal is the faster option for urgent travel, with a higher government fee and some extra documents. We fill the form and book the earliest appointment either way.',
      },
      {
        q: 'Can you help with a visa?',
        a: 'Yes. We prepare the application and arrange your documents in the format the embassy asks for, for normal and urgent visas.',
      },
      {
        q: 'Do you make PAN cards?',
        a: 'Yes, new PAN cards and corrections to an existing one.',
      },
    ],
  },
  {
    topic: 'GST, tax and business',
    items: [
      {
        q: 'Can you register my business for GST?',
        a: 'Yes. We handle GST registration, and after that the monthly or quarterly returns and e-way bills, so you don’t miss a due date.',
      },
      {
        q: 'Do you file income tax returns?',
        a: 'Yes, ITR for salaried people, shop owners and small businesses. Bring your Form 16 or account details and we take care of the rest.',
      },
      {
        q: 'What registrations do you handle for a new business?',
        a: 'Company formation, Udyog Aadhaar (MSME), FSSAI food licence, shop registration, trademark, digital signature, EPF and ESIC, IEC and more. Ask us which ones your business needs.',
      },
    ],
  },
  {
    topic: 'Insurance and banking',
    items: [
      {
        q: 'Do you help with insurance claims and renewals?',
        a: 'Yes. We help you choose a life, health or motor policy, remind you before it’s due for renewal, and help you fill in the forms when you claim.',
      },
      {
        q: 'Can I withdraw cash with my Aadhaar?',
        a: 'Yes, with Aadhaar banking (AEPS) or a Micro ATM, using your fingerprint and your bank account linked to Aadhaar.',
      },
      {
        q: 'Can I send money to any bank account?',
        a: 'Yes. Give us the cash and the receiver’s account details, and we transfer it for a small fee.',
      },
    ],
  },
]

// The questions shown, picked from each topic.
const FAQ_LIST = [
  FAQS[0].items[0], // documents
  FAQS[0].items[2], // fees
  FAQS[1].items[0], // Tatkal tickets
  FAQS[2].items[0], // passport
  FAQS[3].items[0], // GST
  FAQS[4].items[0], // insurance
  FAQS[4].items[1], // AEPS
]

// A sample WhatsApp exchange, to show how quick asking is.
const CHAT = [
  { me: true, text: 'Namaste, what do I need for a Tatkal passport?' },
  { me: false, text: 'Aadhaar, PAN and your old passport if you have one. Come in tomorrow at 11 and we’ll book your slot.' },
  { me: true, text: 'Great, thank you 🙏' },
]

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-3 sm:gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Navy panel: the heading and a sample chat */}
        <Reveal className="relative flex flex-col overflow-hidden rounded-[28px] bg-[#0f1530] px-5 py-6 text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)] sm:rounded-[32px] sm:p-10 md:max-lg:grid md:max-lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:max-lg:items-center md:max-lg:gap-x-10">
          <div
            className="pointer-events-none absolute -top-24 -left-20 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(109_74_255/0.35),transparent)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 -bottom-28 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(47_107_255/0.25),transparent)]"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="m-0 text-sm font-bold text-[#a9b8ff]">Questions</p>
            <h2 className="relative m-0 mt-2 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
              Answers before you come in.
            </h2>
            <p className="relative m-0 mt-2 max-w-sm text-[15px] leading-relaxed text-white/65 sm:mt-3 sm:text-base">
              The things people ask us most. Anything else, just send a message.
            </p>
          </div>

          <div className="relative mt-5 flex flex-1 flex-col justify-end sm:mt-8 md:max-lg:mt-0">
            <div className="rounded-[24px] bg-[#0b1028]/70 p-4 ring-1 ring-white/10 max-sm:hidden" aria-hidden="true">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                <img src="/brand/mark-64.png" alt="" width="32" height="32" className="size-8 rounded-lg" />
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-white">Manish Associates</span>
                  <span className="block text-[11px] text-[#7ff0b6]">usually replies in office hours</span>
                </span>
                <WhatsAppIcon size={18} className="ml-auto text-[#25D366]" />
              </div>
              <div className="flex flex-col gap-2 pt-3">
                {CHAT.map((m, k) => (
                  <motion.p
                    key={k}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + k * 0.45, duration: 0.4 }}
                    className={`m-0 max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
                      m.me ? 'self-end rounded-br-md bg-[#25D366]/90 text-[#062b16]' : 'self-start rounded-bl-md bg-white/10 text-white/90'
                    }`}
                  >
                    {m.text}
                  </motion.p>
                ))}
              </div>
            </div>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={waLink('Namaste, I have a question:')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-2xl bg-white px-5 font-bold sm:mt-5 text-[#141b34] no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
            >
              <WhatsAppIcon size={18} className="text-[#25D366]" /> Ask your question
            </motion.a>
          </div>
        </Reveal>

        {/* The questions */}
        <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:gap-3">
          {FAQ_LIST.map((item, i) => {
            const on = open === i
            return (
              <motion.li
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className={`overflow-hidden rounded-[18px] bg-white ring-1 sm:rounded-[24px] transition-shadow ${
                  on
                    ? 'shadow-[0_24px_50px_-34px_rgb(40_40_120/0.55)] ring-[#d6d2f5]'
                    : 'shadow-[0_1px_2px_rgb(15_21_48/0.05)] ring-[#e3e6f0]'
                }`}
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setOpen(on ? -1 : i)}
                    className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3.5 py-3 text-left text-[15px] leading-snug font-bold text-[#0e1325] sm:gap-4 sm:px-6 sm:py-4 sm:text-base sm:leading-normal"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold sm:size-9 sm:rounded-xl sm:text-sm transition-colors ${on ? 'bg-gradient-to-br from-[#6d4aff] to-[#2f6bff] text-white' : 'bg-[#f1f0fb] text-[#5b37f0]'}`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">{item.q}</span>
                    <motion.span
                      animate={{ rotate: on ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-base sm:size-8 sm:text-lg leading-none font-bold transition-colors ${on ? 'bg-[#141b34] text-white' : 'bg-[#eef0f7] text-[#141b34]'}`}
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
                      className="overflow-hidden"
                    >
                      <p className="m-0 px-3.5 pb-4 text-sm leading-relaxed text-[#5a6280] sm:pr-6 sm:pb-5 sm:pl-[4.75rem] sm:text-[15px]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ---------- Contact ---------- */

function ContactSection() {
  const details = [
    { Icon: Phone, label: 'Phone and WhatsApp', value: CONTACT.phone, ph: 'Phone number', href: telHref, order: 'lg:order-1' },
    { Icon: Clock, label: 'Opening hours', value: CONTACT.hours, ph: 'Opening hours', order: 'lg:order-3' },
    {
      Icon: MapPin,
      label: 'Visit the office',
      value: CONTACT.address,
      ph: 'Shop address',
      href: mapsHref,
      wide: true,
      order: 'lg:order-2',
    },
  ]
  return (
    <section id="contact" className="scroll-mt-20 bg-[#f6f7fb] px-5 py-8 pb-12 sm:px-8 sm:pb-16 lg:py-10 lg:pb-20">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0f1530] text-white shadow-[0_40px_80px_-48px_rgb(15_21_48/0.9)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-32 -bottom-40 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(47_107_255/0.3),transparent)]" />
          <div className="absolute -top-32 left-1/3 size-[380px] rounded-full bg-[radial-gradient(closest-side,rgb(109_74_255/0.25),transparent)]" />
        </div>
        <div className="relative grid gap-5 px-5 py-6 sm:gap-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:p-12">
          <div>
            <p className="m-0 mb-2 text-sm font-bold text-[#a9b8ff]">Contact</p>
            <h2 className="m-0 text-[clamp(1.7rem,3.6vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
              Tell us what you need. We’ll take it from there.
            </h2>
            <p className="m-0 mt-3 max-w-lg text-[15px] leading-relaxed text-white/70 sm:mt-4 sm:text-base">
              Walk in, call or send a message. We’ll tell you exactly what to bring, and most work starts the same day.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 font-bold whitespace-nowrap text-[#141b34] sm:gap-2.5 sm:px-5 no-underline shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6)]"
              >
                <WhatsAppIcon size={19} className="text-[#25D366]" />{' '}
                <span>
                  WhatsApp<span className="max-sm:hidden"> us</span>
                </span>
              </motion.a>
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={telHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 font-bold whitespace-nowrap text-white sm:gap-2.5 sm:px-5 no-underline ring-1 ring-white/25 hover:bg-white/[0.06]"
              >
                <Phone size={18} aria-hidden="true" /> <span className="sm:hidden">Call us</span>
                <span className="max-sm:hidden">Call the office</span>
              </motion.a>
            </div>
            <dl className="m-0 mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-2.5 lg:grid-cols-1">
              {details.map(({ Icon, label, value, ph, href, wide, order }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/10 sm:gap-3.5 sm:p-3.5 ${order} ${wide ? 'col-span-2 lg:col-span-1' : 'max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-2'}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br sm:size-10 from-[#6d4aff] to-[#2f6bff]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-bold text-[#a9b8ff]">{label}</dt>
                    <dd className="m-0 mt-0.5 text-sm font-semibold text-white/90 sm:text-[15px]">
                      <Detail value={value} placeholder={ph} href={href} />
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Map of the office */}
          <div className="relative min-h-[240px] overflow-hidden rounded-[22px] bg-[#1a2147] ring-1 ring-white/15 sm:min-h-[320px] sm:rounded-[24px] lg:min-h-full">
            <iframe
              title="Map showing the Manish Associates office in Super Bazar, Rewa"
              src={`https://maps.google.com/maps?q=${MAP.lat},${MAP.lng}&t=h&z=17&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="absolute top-3 right-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-[13px] font-bold sm:h-10 sm:px-4 sm:text-sm text-[#141b34] no-underline shadow-[0_10px_24px_-10px_rgb(0_0_0/0.6)]"
            >
              <MapPin size={16} className="text-[#5b37f0]" aria-hidden="true" /> Get directions
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const cols = [
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
  ]
  const linkClass = 'inline-flex min-h-8 items-center text-[13px] text-white/60 no-underline hover:text-white sm:min-h-9 sm:text-sm'
  const column = (col) => (
    <div key={col.title}>
      <p className="m-0 text-sm font-bold text-white">{col.title}</p>
      <ul className="m-0 mt-2 flex list-none flex-col p-0 sm:mt-3">
        {col.links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link to={l.to} className={linkClass}>
                {l.label}
              </Link>
            ) : (
              <a href={l.href} className={linkClass}>
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <footer className="bg-[#0b1028] px-5 pt-10 pb-6 text-white sm:px-8 sm:pt-12 sm:pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] md:gap-y-10">
          <div className="col-span-2 md:col-span-1">
            <BrandMark light />
            <p className="m-0 mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Insurance, banking, GST and tax, registrations, passports, tickets and tours, at one counter.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-1 p-0 text-sm lg:hidden">
              <li>
                <a href={telHref} className="inline-flex min-h-8 items-center gap-2 text-white/80 no-underline hover:text-white">
                  <Phone size={15} className="text-[#a9b8ff]" aria-hidden="true" /> {CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center gap-2 text-white/80 no-underline hover:text-white"
                >
                  <MapPin size={15} className="shrink-0 text-[#a9b8ff]" aria-hidden="true" /> Super Bazar, Dhekha, Rewa
                </a>
              </li>
            </ul>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] lg:mt-5 px-4 text-sm font-bold text-white no-underline ring-1 ring-white/12 hover:bg-white/[0.12]"
            >
              <WhatsAppIcon size={17} className="text-[#25D366]" /> WhatsApp us
            </a>
          </div>
          {column(cols[0])}
          {/* On phones, Popular and Company share the second column */}
          <div className="flex flex-col gap-6 md:contents">
            {column(cols[1])}
            {column(cols[2])}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-0 border-t border-solid border-white/10 pt-5 text-xs text-white/45 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p className="m-0">© {YEAR} Manish Associates. All rights reserved.</p>
          <p className="m-0 lg:hidden">{CONTACT.hours}</p>
        </div>
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
  // Opened with an anchor (an old link such as /#top or /#contact), or the anchor typed in: go to that section,
  // then clear it from the address.
  useEffect(() => {
    const clear = () => {
      const id = window.location.hash.slice(1)
      if (!id) return
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      if (id === 'top') window.scrollTo({ top: 0 })
      else requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
    }
    clear()
    window.addEventListener('hashchange', clear)
    return () => window.removeEventListener('hashchange', clear)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div
        onClick={scrollToHash}
        className="min-h-screen bg-[#f6f7fb] font-[Manrope,system-ui,sans-serif] [&_button]:[font-family:inherit] text-[#0e1325] antialiased [scroll-behavior:smooth]"
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
